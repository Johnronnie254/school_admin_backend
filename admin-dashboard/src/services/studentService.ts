import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://78.111.67.196/api';

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
    try {
      const response = await axios.get(`${API_URL}/students/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getStudentById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/students/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  createStudent: async (data: StudentFormData) => {
    try {
      const response = await axios.post(`${API_URL}/students/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  updateStudent: async (id: string, data: Partial<StudentFormData>) => {
    try {
      const response = await axios.put(`${API_URL}/students/${id}/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  deleteStudent: async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/students/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  // Additional student-specific endpoints
  getStudentExamResults: async (studentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/students/${studentId}/exam-results/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getStudentFeeRecords: async (studentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/students/${studentId}/fee-records/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  initiatePayment: async (studentId: string, paymentData: PaymentData) => {
    try {
      const response = await axios.post(`${API_URL}/students/${studentId}/initiate_payment/`, paymentData);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  }
}; 