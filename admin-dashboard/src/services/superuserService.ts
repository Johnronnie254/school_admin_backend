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
  is_active: boolean;
}

export interface SuperuserStats {
  school_count: number;
  users_count: number;
  teachers_count: number;
  students_count: number;
}

export interface SchoolStats {
  school_name: string;
  admin_count: number;
  teacher_count: number;
  student_count: number;
  parent_count: number;
}

export interface AdminUser {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const superuserService = {
  getDashboardStats: async (): Promise<SuperuserStats> => {
    const response = await apiClient.get('/api/superuser/dashboard/');
    return response.data;
  },

  getSchools: async (): Promise<School[]> => {
    const response = await apiClient.get('/api/schools/');
    return response.data.results;
  },

  getSchool: async (id: string): Promise<School> => {
    const response = await apiClient.get(`/api/schools/${id}/`);
    return response.data;
  },

  createSchool: async (schoolData: Partial<School>): Promise<School> => {
    const response = await apiClient.post('/api/superuser/create_school/', schoolData);
    return response.data;
  },

  updateSchool: async (id: string, schoolData: Partial<School>): Promise<School> => {
    const response = await apiClient.put(`/api/schools/${id}/`, schoolData);
    return response.data;
  },

  deleteSchool: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/schools/${id}/`);
  },

  getSchoolStats: async (schoolId: string): Promise<SchoolStats> => {
    const response = await apiClient.get(`/api/superuser/${schoolId}/school_statistics/`);
    return response.data;
  },

  createAdminForSchool: async (schoolId: string, adminData: AdminUser): Promise<AdminUserResponse> => {
    const response = await apiClient.post<AdminUserResponse>(`/api/superuser/${schoolId}/create_admin_for_school/`, adminData);
    return response.data;
  }
}; 