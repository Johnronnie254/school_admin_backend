console.log('--- LOADING api.ts ---');

import axios, { AxiosError } from 'axios';

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
  baseURL: 'https://www.educitebackend.co.ke',
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Create axios instance
export const apiClient = axios.create(API_CONFIG);

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    console.log('🔄 Request starting:', config.url);

    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // URL normalization
    if (config.url && !config.url.startsWith('http')) {
      // Remove any leading/trailing slashes from baseURL
      const base = (config.baseURL || '').replace(/\/+$/, '');
      
      // Clean up the path
      let path = config.url.replace(/^\/+/, '').replace(/\/+$/, '');
      
      // Add api prefix if needed
      if (!path.startsWith('api/')) {
        path = `api/${path}`;
      }
      
      // Add trailing slash for Django
      path = `${path}/`;
      
      // Construct final URL
      config.url = `${base}/${path}`;
      console.log('📡 Final URL:', config.url);
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Request successful:', response.config.url);
    return response;
  },
  async (error) => {
    if (!error.response) {
      // Network error
      console.error('🌐 Network Error:', error.message);
      if (!navigator.onLine) {
        console.log('📡 No internet connection');
        return Promise.reject(new Error('No internet connection. Please check your network.'));
      }
      return Promise.reject(new Error('Unable to connect to the server. Please try again.'));
    }

    console.log('⚠️ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });

    // Handle 401 Unauthorized
    if (error.response.status === 401 && !error.config?._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { authService } = await import('@/services/auth.service');
        await authService.refreshToken();
        error.config._retry = true;
        return apiClient(error.config);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

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
  update: (id: string, data: UpdateSchoolData) => apiClient.patch(`/schools/${id}/`, data),
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