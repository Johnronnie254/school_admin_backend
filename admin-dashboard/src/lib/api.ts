import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://educitebackend.co.ke/api';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    console.error('Response Error:', {
      status: error.response?.status,
      url: originalRequest?.url,
      error: error.response?.data,
    });

    // Handle 401 Unauthorized error
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && originalRequest) {
        try {
          const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('accessToken', access);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return axios(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        // No refresh token available, redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export { api as apiClient };

// Admin API endpoints
export const adminApi = {
  clearExamResults: () => api.post('/admin/clear_exam_results/'),
  clearFeeRecords: () => api.post('/admin/clear_fee_records/'),
  updateSchoolSettings: (data: SchoolSettings) => api.put('/admin/update_school_settings/', data),
  bulkPromoteStudents: (data: BulkPromoteStudentsData) => api.post('/admin/bulk_promote_students/', data),
};

// School API endpoints
export const schoolApi = {
  create: (data: CreateSchoolData) => api.post('/schools/', data),
  list: () => api.get('/schools/'),
  getById: (id: string) => api.get(`/schools/${id}/`),
  update: (id: string, data: UpdateSchoolData) => api.put(`/schools/${id}/`, data),
  delete: (id: string) => api.delete(`/schools/${id}/`),
  getStatistics: (id: string) => api.get(`/schools/${id}/statistics/`),
  getTeachers: (id: string) => api.get(`/schools/${id}/teachers/`),
  getParents: (id: string) => api.get(`/schools/${id}/parents/`),
};

// Auth API endpoints
export const authApi = {
  login: (data: LoginData) => api.post('/auth/login/', data),
  register: (data: RegisterData) => api.post('/auth/register/', data),
  logout: () => api.post('/auth/logout/'),
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