import axios, { AxiosError } from 'axios';
import { authService } from '@/services/auth.service';

// Types
export interface ApiError extends AxiosError {
  message: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://educitebackend.co.ke',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
export const apiClient = axios.create(API_CONFIG);

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    console.log('🌐 Making API request to:', config.url);
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('🔑 Adding access token to request');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('⚠️ No access token available for request');
    }
    // Ensure URL doesn't have any extra slashes or spaces
    if (config.url) {
      config.url = config.url.replace(/\/+/g, '/').trim();
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for handling token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API request successful:', response.config.url);
    return response;
  },
  async (error) => {
    console.log('⚠️ API request failed:', error.config.url);
    console.log('📊 Error status:', error.response?.status);
    console.log('📝 Error data:', error.response?.data);

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 Attempting token refresh due to 401 error');
      originalRequest._retry = true;

      try {
        console.log('📤 Calling refreshToken()');
        const response = await authService.refreshToken();
        
        if (response) {
          console.log('✅ Token refresh successful');
          console.log('🔄 Retrying original request');
          return apiClient(originalRequest);
        } else {
          console.log('❌ Token refresh failed - no response');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh error:', refreshError);
        return Promise.reject(error);
      }
    }

    console.log('❌ Request failed without recovery');
    return Promise.reject(error);
  }
);

// Admin API endpoints
export const adminApi = {
  clearExamResults: () => apiClient.post('/admin/clear_exam_results/'),
  clearFeeRecords: () => apiClient.post('/admin/clear_fee_records/'),
  updateSchoolSettings: (data: SchoolSettings) => apiClient.put('/admin/update_school_settings/', data),
  bulkPromoteStudents: (data: BulkPromoteStudentsData) => apiClient.post('/admin/bulk_promote_students/', data),
};

// School API endpoints
export const schoolApi = {
  create: (data: CreateSchoolData) => apiClient.post('/schools/', data),
  list: () => apiClient.get('/schools/'),
  getById: (id: string) => apiClient.get(`/schools/${id}/`),
  update: (id: string, data: UpdateSchoolData) => apiClient.put(`/schools/${id}/`, data),
  delete: (id: string) => apiClient.delete(`/schools/${id}/`),
  getStatistics: (id: string) => apiClient.get(`/schools/${id}/statistics/`),
  getTeachers: (id: string) => apiClient.get(`/schools/${id}/teachers/`),
  getParents: (id: string) => apiClient.get(`/schools/${id}/parents/`),
};

// Auth API endpoints
export const authApi = {
  login: (data: LoginData) => apiClient.post('/auth/login/', data),
  register: (data: RegisterData) => apiClient.post('/auth/register/', data),
  logout: () => apiClient.post('/auth/logout/'),
};

// Types
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

export interface SchoolStats {
  total_teachers: number;
  total_students: number;
  total_parents: number;
  active_users: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  subjects: string[];
  class_assigned?: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone_number: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
}

export interface CreateSchoolData {
  name: string;
  address: string;
  phone_number: string;
  email: string;
  website?: string;
  registration_number: string;
}

export interface UpdateSchoolData extends Partial<CreateSchoolData> {
  is_active?: boolean;
}

export interface SchoolSettings {
  academic_year: number;
  term: string;
  fee_structure: Record<string, number>;
}

export interface BulkPromoteStudentsData {
  grade: number;
  students: string[];
} 