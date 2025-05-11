import { apiClient } from '@/lib/api';
import axios from 'axios';

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

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  school?: {
    id: string;
    name: string;
  };
}

export const superuserService = {
  getDashboardStats: async (): Promise<SuperuserStats> => {
    const response = await apiClient.get('superuser/dashboard/');
    return response.data;
  },

  getSchools: async (): Promise<School[]> => {
    try {
      console.log('🏫 Fetching schools list');
      const token = localStorage.getItem('access_token');
      console.log('🎫 Token available for school fetch:', !!token);
      
      const response = await apiClient.get('schools/', {
        timeout: 15000 // Increase timeout for this particular request
      });
      
      console.log('✅ Schools fetch successful:', response.status);
      return response.data.results || response.data;
    } catch (error: any) {
      console.error('❌ Error fetching schools:', error.message);
      if (error.response) {
        console.error('📊 Error status:', error.response.status);
        console.error('📝 Error data:', error.response.data);
      }
      
      // If token is invalid, clear it to force a new login
      if (error.response?.status === 401) {
        console.log('🔒 Clearing invalid token');
        localStorage.removeItem('access_token');
      }
      
      // Return empty array on error to prevent crashes
      return [];
    }
  },

  getSchool: async (id: string): Promise<School> => {
    const response = await apiClient.get(`schools/${id}/`);
    return response.data;
  },

  createSchool: async (schoolData: Partial<School>): Promise<School> => {
    const response = await apiClient.post('superuser/create_school/', schoolData);
    return response.data;
  },

  updateSchool: async (id: string, schoolData: Partial<School>): Promise<School> => {
    const response = await apiClient.put(`schools/${id}/`, schoolData);
    return response.data;
  },

  deleteSchool: async (id: string): Promise<void> => {
    await apiClient.delete(`schools/${id}/`);
  },

  getSchoolStats: async (schoolId: string): Promise<SchoolStats> => {
    const response = await apiClient.get(`superuser/${schoolId}/school_statistics/`);
    return response.data;
  },

  createAdminForSchool: async (schoolId: string, adminData: AdminUser): Promise<AdminUserResponse> => {
    const response = await apiClient.post<AdminUserResponse>(`superuser/${schoolId}/create_admin_for_school/`, adminData);
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('users/');
    return response.data.results || response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`users/${userId}/`);
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.post<User>('users/', data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(`users/${id}/`, data);
    return response.data;
  },

  // Add a direct API call to get schools without going through the apiClient
  // This is useful for testing authentication without triggering refresh loops
  testAuthCall: async (): Promise<boolean> => {
    try {
      console.log('🔑 Testing authentication with direct API call');
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('❌ No token available for test call');
        return false;
      }
      
      console.log('🎫 Using token for test auth call');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://educitebackend.co.ke'}/api/schools/`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 15000
        }
      );
      
      console.log('✅ Authentication test successful:', response.status);
      return true;
    } catch (error: any) {
      console.error('❌ Authentication test failed:', error.message);
      if (error.response) {
        console.error('📊 Test call status:', error.response.status);
        console.error('📝 Test call data:', error.response.data);
      }
      return false;
    }
  },
}; 