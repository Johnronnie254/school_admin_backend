import { apiClient } from '@/lib/api';

export interface School {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  website?: string;
  logo?: string;
  registration_number: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolStatistics {
  total_teachers: number;
  total_students: number;
  total_parents: number;
  active_users: number;
  students_per_grade: Array<{ grade: number; count: number }>;
  recent_notifications: Array<{
    message: string;
    target_group: string;
    created_at: string;
  }>;
  school_name: string;
}

export const schoolService = {
  getSchoolStatistics: async () => {
    const response = await apiClient.get<SchoolStatistics>('/api/school/statistics/');
    return response.data;
  },
  
  getCurrentSchool: async () => {
    const response = await apiClient.get<School>('/api/current-school/');
    return response.data;
  },
  
  getSchoolById: async (id: string) => {
    const response = await apiClient.get<School>(`/api/schools/${id}/`);
    return response.data;
  }
};