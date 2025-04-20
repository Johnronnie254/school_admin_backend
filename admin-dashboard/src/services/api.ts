import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = 'http://78.111.67.196/api';

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

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const newTokens = await authService.refreshToken(refreshToken);
          localStorage.setItem('accessToken', newTokens.access);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          }
          
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth service
const authService = {
  register: async (data: RegisterData): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('/auth/register/', data);
  },

  login: async (data: LoginData): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('/auth/login/', data);
  },

  logout: async (): Promise<AxiosResponse<void>> => {
    return api.post('/auth/logout/');
  },

  resetPassword: async (data: ResetPasswordData): Promise<AxiosResponse<void>> => {
    return api.post('/auth/reset-password/', data);
  },

  confirmReset: async (data: ConfirmResetData): Promise<AxiosResponse<void>> => {
    return api.post('/auth/confirm-reset/', data);
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/token/refresh/', { refresh: refreshToken });
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