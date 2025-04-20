import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_CONFIG } from '@/config/api';

// Types
interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
}

interface ResetPasswordData {
  email: string;
}

interface ConfirmResetData {
  token: string;
  password: string;
}

interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

interface School {
  id: number;
  name: string;
  registration_number: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface CreateSchoolData {
  name: string;
  registration_number: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
}

interface UpdateSchoolData extends Partial<CreateSchoolData> {
  is_active?: boolean;
}

export interface ApiError extends AxiosError {
  message: string;
}

// Create axios instance
const api = axios.create(API_CONFIG);

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure URL doesn't have any extra slashes or spaces
    if (config.url) {
      config.url = config.url.replace(/\/+/g, '/').trim();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh/`, { refresh: refreshToken });
        const { access } = response.data;
        localStorage.setItem('accessToken', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Auth service
const authService = {
  register: async (data: RegisterData): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('auth/register/', data);
  },

  login: async (data: LoginData): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('auth/login/', data);
  },

  logout: async (): Promise<AxiosResponse<void>> => {
    return api.post('auth/logout/');
  },

  resetPassword: async (data: ResetPasswordData): Promise<AxiosResponse<void>> => {
    return api.post('auth/password/reset/', data);
  },

  confirmReset: async (data: ConfirmResetData): Promise<AxiosResponse<void>> => {
    return api.post('auth/password/reset/confirm/', data);
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('auth/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
};

// School service
const schoolService = {
  getSchools: async (page = 1): Promise<AxiosResponse<PaginatedResponse<School>>> => {
    return api.get(`/schools/?page=${page}`);
  },

  getSchoolById: async (id: number): Promise<AxiosResponse<School>> => {
    return api.get(`/schools/${id}/`);
  },

  createSchool: async (data: CreateSchoolData): Promise<AxiosResponse<School>> => {
    return api.post('/schools/', data);
  },

  updateSchool: async (id: number, data: UpdateSchoolData): Promise<AxiosResponse<School>> => {
    return api.patch(`/schools/${id}/`, data);
  },

  deleteSchool: async (id: number): Promise<AxiosResponse<void>> => {
    return api.delete(`/schools/${id}/`);
  },
};

export default api;
export { authService, schoolService };
export type { School, CreateSchoolData, UpdateSchoolData, PaginatedResponse, ErrorResponse };