import { apiClient } from '@/lib/api';
import axios, { AxiosError } from 'axios';
import { School, CreateSchoolDto, UpdateSchoolDto } from '@/types/school';

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
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
  role: string;
}

export interface AdminUserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
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
    } catch (error: unknown) {
      console.error('❌ Error fetching schools:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof AxiosError) {
        console.error('📊 Error status:', error.response?.status);
        console.error('📝 Error data:', error.response?.data);
        
        // If token is invalid, clear it to force a new login
        if (error.response?.status === 401) {
          console.log('🔒 Clearing invalid token');
          localStorage.removeItem('access_token');
        }
      }
      
      // Return empty array on error to prevent crashes
      return [];
    }
  },

  getSchool: async (id: number): Promise<School> => {
    const response = await apiClient.get(`schools/${id}/`);
    return response.data;
  },

  createSchool: async (schoolData: CreateSchoolDto): Promise<School> => {
    const response = await apiClient.post('superuser/create_school/', schoolData);
    return response.data;
  },

  updateSchool: async (id: number, schoolData: UpdateSchoolDto): Promise<School> => {
    const response = await apiClient.put(`schools/${id}/`, schoolData);
    return response.data;
  },

  deleteSchool: async (id: number): Promise<void> => {
    await apiClient.delete(`schools/${id}/`);
  },

  getSchoolStats: async (schoolId: number): Promise<SchoolStats> => {
    const response = await apiClient.get(`superuser/${schoolId}/school_statistics/`);
    return response.data;
  },

  getSchoolAdmins: async (schoolId: number): Promise<AdminUserResponse[]> => {
    try {
      console.log('👥 Fetching school admins');
      const response = await apiClient.get(`superuser/${schoolId}/administrators/`);
      console.log('✅ School admins fetch successful:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching school admins:', error);
      if (error instanceof AxiosError) {
        console.error('📊 Error status:', error.response?.status);
        console.error('📝 Error data:', error.response?.data);
      }
      return [];
    }
  },

  createAdminForSchool: async (schoolId: number, adminData: AdminUser): Promise<AdminUserResponse> => {
    const response = await apiClient.post<AdminUserResponse>(`superuser/${schoolId}/create_admin_for_school/`, {
      name: `${adminData.first_name} ${adminData.last_name}`,
      email: adminData.email,
      phone_number: adminData.phone_number,
      password: adminData.password,
      password_confirmation: adminData.password_confirmation,
      role: adminData.role
    });
    return response.data;
  },

  deleteAdmin: async (schoolId: number, adminId: string): Promise<void> => {
    if (!schoolId || !adminId) {
      throw new Error('School ID and Admin ID are required');
    }
    await apiClient.post(`superuser/${schoolId}/delete_admin/`, {
      admin_id: adminId
    });
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
    } catch (error: unknown) {
      console.error('❌ Authentication test failed:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof AxiosError) {
        console.error('📊 Test call status:', error.response?.status);
        console.error('📝 Test call data:', error.response?.data);
      }
      return false;
    }
  },
}; 