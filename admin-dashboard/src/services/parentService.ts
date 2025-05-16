import { apiClient, PaginatedResponse } from '@/lib/api';

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export interface ParentFormData {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
}

class ParentService {
  async getParents(): Promise<PaginatedResponse<Parent>> {
    try {
      console.log('Fetching parents...');
      const response = await apiClient.get<PaginatedResponse<Parent>>('/api/parents/');
      console.log('Parent service response:', response.data);
      
      // Deep check to make sure response has the right structure
      if (response?.data && typeof response.data === 'object') {
        // Ensure results is always an array
        const results = Array.isArray(response.data.results) ? response.data.results : [];
        return {
          count: response.data.count || 0,
          next: response.data.next || null,
          previous: response.data.previous || null,
          results
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
    console.log('Creating parent with data:', data);
    // Use the /api/parents/ endpoint directly like the teacher service does
    const response = await apiClient.post<Parent>('/api/parents/', data);
    console.log('Create parent response:', response.data);
    return response.data;
  }

  async updateParent(id: string, data: Partial<ParentFormData>) {
    const response = await apiClient.put<Parent>(`/api/parents/${id}/`, data);
    return response.data;
  }

  async deleteParent(id: string) {
    await apiClient.delete(`/api/parents/${id}/`);
  }

  async getParentChildren(parentId: string) {
    const response = await apiClient.get(`/api/parents/${parentId}/children/`);
    return response.data;
  }
}

export const parentService = new ParentService(); 