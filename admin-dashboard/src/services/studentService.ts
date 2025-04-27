import { apiClient, PaginatedResponse } from '@/lib/api';

export interface Student {
  id: string;
  name: string;
  guardian: string;
  contact: string;
  grade: number;
  class_assigned: string | null;
  parent: string;
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  name: string;
  guardian: string;
  contact: string;
  grade: number;
  class_assigned?: string;
  parent?: string;
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
  getStudents: async () => {
    const response = await apiClient.get<PaginatedResponse<Student>>('/api/students/');
    return response.data;
  },

  getStudentById: async (id: string) => {
    const response = await apiClient.get<Student>(`/api/students/${id}/`);
    return response.data;
  },

  createStudent: async (data: StudentFormData) => {
    const response = await apiClient.post<Student>('/api/students/', data);
    return response.data;
  },

  updateStudent: async (id: string, data: Partial<StudentFormData>) => {
    const response = await apiClient.put<Student>(`/api/students/${id}/`, data);
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