import { apiClient, PaginatedResponse } from '@/lib/api';

export interface Student {
  id: string;
  name: string;
  guardian: string;
  contact: string;
  grade: number;
  class_assigned: string | null;
  parent: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  name: string;
  guardian: string;
  contact: string;
  grade: number;
  class_assigned?: string;
  parent?: string | null;
}

export interface PaymentData {
  amount: number;
  term: string;
  year: number;
  payment_method: string;
}

export interface ApiErrorResponse {
  message?: string;
  [key: string]: string | string[] | undefined;
}

export const studentService = {
  // Main CRUD operations
  getStudents: async (): Promise<PaginatedResponse<Student>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Student>>('/api/students/');
      // Deep check to make sure response has the right structure
      if (response?.data && typeof response.data === 'object') {
        // Ensure results is always an array
        const results = Array.isArray(response.data.results) ? response.data.results : [];
        return {
          count: response.data.count || 0,
          next: response.data.next || null,
          previous: response.data.previous || null,
          results
        };
      }
      console.error('Malformed response in getStudents:', response);
      return { count: 0, next: null, previous: null, results: [] };
    } catch (error) {
      console.error('Error fetching students:', error);
      // Return an empty paginated response instead of undefined
      return { count: 0, next: null, previous: null, results: [] };
    }
  },

  getStudentById: async (id: string) => {
    const response = await apiClient.get<Student>(`/api/students/${id}/`);
    return response.data;
  },

  createStudent: async (data: StudentFormData) => {
    // Strip out parent if it's not a valid UUID to prevent 400 errors
    const formData = { ...data };
    
    // Check if parent is a valid UUID format using regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (formData.parent && !uuidRegex.test(formData.parent)) {
      // If not a valid UUID, set to null
      formData.parent = null;
    }
    
    const response = await apiClient.post<Student>('/api/students/', formData);
    return response.data;
  },

  updateStudent: async (id: string, data: Partial<StudentFormData>) => {
    // Strip out parent if it's not a valid UUID to prevent 400 errors
    const formData = { ...data };
    
    // Check if parent is a valid UUID format using regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (formData.parent && !uuidRegex.test(formData.parent)) {
      // If not a valid UUID, set to null
      formData.parent = null;
    }
    
    const response = await apiClient.put<Student>(`/api/students/${id}/`, formData);
    return response.data;
  },

  deleteStudent: async (id: string) => {
    await apiClient.delete(`/api/students/${id}/`);
  },

  // Additional student-specific endpoints
  getStudentExamResults: async (studentId: string) => {
    const response = await apiClient.get(`/api/students/${studentId}/exam-results/`);
    return response.data;
  },

  getStudentFeeRecords: async (studentId: string) => {
    const response = await apiClient.get(`/api/students/${studentId}/fee-records/`);
    return response.data;
  },

  initiatePayment: async (studentId: string, paymentData: PaymentData) => {
    const response = await apiClient.post(`/api/students/${studentId}/initiate_payment/`, paymentData);
    return response.data;
  }
}; 