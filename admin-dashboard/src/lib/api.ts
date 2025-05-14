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
    console.log('INTERCEPTOR: Original config.url:', config.url);
    console.log('INTERCEPTOR: Original config.baseURL:', config.baseURL);

    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('INTERCEPTOR: Adding token...');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('INTERCEPTOR: No token found.');
    }

    // Make sure we're connecting to the right URL format for Django
    if (config.url && config.baseURL && !config.url.startsWith('http')) {
      // Ensure baseURL does NOT end with a slash
      const base = config.baseURL.replace(/\/+$/, ''); 
      
      // Prepare the path
      let path = config.url.replace(/^\/+/g, ''); // Remove leading slashes
      
      // Make sure path starts with api/
      if (!path.startsWith('api/')) { 
        path = `api/${path}`; // Add api/ prefix if missing
      }
      
      // Make sure path ends with trailing slash for Django
      if (!path.endsWith('/')) {
        path = `${path}/`; // Add trailing slash if missing
      }
      
      // Set the full URL
      config.url = `${base}/${path}`;
      console.log(`INTERCEPTOR: Constructed final URL: ${config.url}`);
    } else {
       console.log(`INTERCEPTOR: URL not modified (already absolute or missing base/url): ${config.url}`);
    }
    
    console.log('INTERCEPTOR: Final config object:', config);

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
    console.log('⚠️ API request failed:', error.config?.url);
    console.log('📊 Error status:', error.response?.status);
    console.log('📝 Error data:', error.response?.data);

    // Check if the request itself includes a noAuth flag to avoid auth handling
    // This is useful for auth-related endpoints
    if (error.config?._noAuth) {
      console.log('🔓 Request marked as noAuth, skipping auth handling');
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    // Handle 401 errors by attempting token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 Attempting token refresh due to 401 error');
      originalRequest._retry = true;

      // Check if we actually have a refresh token before trying
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.log('❌ No refresh token available to refresh');
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        console.log('📤 Calling refreshToken()');
        // Import auth service dynamically to avoid circular dependency
        const { authService } = await import('@/services/auth.service');
        const response = await authService.refreshToken();
        
        if (response) {
          console.log('✅ Token refresh successful');
          console.log('🔄 Retrying original request');
          // Update the token in the original request
          originalRequest.headers.Authorization = `Bearer ${localStorage.getItem('access_token')}`;
          return apiClient(originalRequest);
        } else {
          console.log('❌ Token refresh failed - no response');
          clearAuthAndRedirect();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh error:', refreshError);
        clearAuthAndRedirect();
        return Promise.reject(error);
      }
    }

    console.log('❌ Request failed without recovery');
    return Promise.reject(error);
  }
);

// Helper function to clear auth and redirect
function clearAuthAndRedirect() {
  // Create a flag to prevent duplicate redirects
  if (window._isRedirecting) {
    console.log('🚫 Redirect already in progress, skipping');
    return;
  }
  window._isRedirecting = true;

  // Clear tokens to prevent refresh loops
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // Determine the correct login route based on user role
  let redirectTo = '/login';
  if (localStorage.getItem('is_superuser') === 'true') {
    localStorage.removeItem('is_superuser');
    redirectTo = '/superuser/login';
  }
  
  console.log(`🔄 Redirecting to ${redirectTo}`);
  
  // Use a timeout to allow current execution to complete
  setTimeout(() => {
    window.location.href = redirectTo;
    // Reset the redirect flag after a delay
    setTimeout(() => {
      window._isRedirecting = false;
    }, 1000);
  }, 100);
}

// Add a type declaration for the global window object
declare global {
  interface Window {
    _isRedirecting?: boolean;
  }
}

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