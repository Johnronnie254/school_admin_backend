import { apiClient, PaginatedResponse } from '@/lib/api';
import { Student } from './studentService';

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  school: string;
  created_at: string;
  children?: Student[];
}

export interface ParentFormData {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
  school?: string;
}

class ParentService {
  async getParents(): Promise<PaginatedResponse<Parent>> {
    try {
      console.log('Fetching parents...');
      const response = await apiClient.get<Parent[] | PaginatedResponse<Parent>>('/api/parents/');
      console.log('Parent service response:', response.data);
      
      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        // Direct array response (when pagination_class = None)
        return {
          count: response.data.length,
          next: null,
          previous: null,
          results: response.data
        };
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        // Paginated response format
        return {
          count: response.data.count || 0,
          next: response.data.next || null,
          previous: response.data.previous || null,
          results: Array.isArray(response.data.results) ? response.data.results : []
        };
      }
      
      console.error('Malformed response in getParents:', response);
      return { count: 0, next: null, previous: null, results: [] };
    } catch (error) {
      console.error('Error fetching parents:', error);
      // Return an empty paginated response instead of undefined
      return { count: 0, next: null, previous: null, results: [] };
    }
  }

  async getParentById(id: string) {
    const response = await apiClient.get<Parent>(`/api/parents/${id}/`);
    return response.data;
  }

  async createParent(data: ParentFormData) {
    try {
      console.log('Creating parent with data:', data);
      const response = await apiClient.post<Parent>('/api/parents/', data);
      console.log('Create parent response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating parent:', error);
      throw error;
    }
  }

  async updateParent(id: string, data: Partial<ParentFormData>) {
    const response = await apiClient.put<Parent>(`/api/parents/${id}/`, data);
    return response.data;
  }

  async deleteParent(id: string) {
    try {
      // The backend will handle cascade delete of children
      await apiClient.delete(`/api/parents/${id}/`);
    } catch (error) {
      console.error('Error deleting parent:', error);
      throw error;
    }
  }
}

export const parentService = new ParentService(); 