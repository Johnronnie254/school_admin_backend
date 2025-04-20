import axios from 'axios';
import { toast } from 'react-hot-toast';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } 
    // Handle other errors
    else {
      toast.error(message);
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