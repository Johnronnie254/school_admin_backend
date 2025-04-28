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

export const parentService = {
  getParents: async () => {
    console.log('Fetching parents...');
    const response = await apiClient.get<PaginatedResponse<Parent>>('/api/parents/');
    console.log('Parent service response:', response.data);
    return response.data;
  },

  getParentById: async (id: string) => {
    const response = await apiClient.get<Parent>(`/api/parents/${id}/`);
    return response.data;
  },

  createParent: async (data: ParentFormData) => {
    console.log('Creating parent with data:', data);
    const response = await apiClient.post<Parent>('/api/auth/register/', {
      ...data,
      role: 'parent'
    });
    console.log('Create parent response:', response.data);
    return response.data;
  },

  updateParent: async (id: string, data: Partial<ParentFormData>) => {
    const response = await apiClient.put<Parent>(`/api/parents/${id}/`, data);
    return response.data;
  },

  deleteParent: async (id: string) => {
    await apiClient.delete(`/api/parents/${id}/`);
  },

  getParentChildren: async (parentId: string) => {
    const response = await apiClient.get(`/api/parents/${parentId}/children/`);
    return response.data;
  }
}; 