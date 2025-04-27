import { apiClient, PaginatedResponse } from '@/lib/api';

interface Class {
  id: string;
  name: string;
  teacher: string;
  students: string[];
  subjects: string[];
}

interface ClassFormData {
  name: string;
  teacher: string;
  subjects: string[];
}

export const classService = {
  getClasses: async (): Promise<PaginatedResponse<Class>> => {
    const { data } = await apiClient.get<PaginatedResponse<Class>>('/api/classes/');
    return data;
  },

  getClass: async (id: string): Promise<Class> => {
    const { data } = await apiClient.get<Class>(`/api/classes/${id}/`);
    return data;
  },

  createClass: async (formData: ClassFormData): Promise<Class> => {
    const { data } = await apiClient.post<Class>('/api/classes/', formData);
    return data;
  },

  updateClass: async (id: string, formData: Partial<ClassFormData>): Promise<Class> => {
    const { data } = await apiClient.put<Class>(`/api/classes/${id}/`, formData);
    return data;
  },

  deleteClass: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/classes/${id}/`);
  }
}; 