import { apiClient, PaginatedResponse } from '@/lib/api';

export interface Student {
  id: string;
  name: string;
  contact: string;
  grade: number;
  class_assigned: string | null;
  parent: string;
  school: string;
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  name: string;
  contact: string;
  grade: number;
  class_assigned?: string;
  parent: string;
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
      const response = await apiClient.get<Student[] | PaginatedResponse<Student>>('/students/');
      
      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        // If the response is a direct array, convert it to paginated format
        return {
          count: response.data.length,
          next: null,
          previous: null,
          results: response.data
        };
      } else if (response.data.results) {
        // If it's already in paginated format, return as is
        return {
          count: response.data.count || response.data.results.length,
          next: response.data.next || null,
          previous: response.data.previous || null,
          results: response.data.results
        };
      }

      // If neither format matches, log error and return empty results
      console.error('Unexpected response format:', response.data);
      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    } catch (error) {
      console.error('Error in getStudents:', error);
      throw error;
    }
  },

  getStudentById: async (id: string): Promise<Student> => {
    try {
      const response = await apiClient.get<Student>(`/students/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error in getStudentById(${id}):`, error);
      throw error;
    }
  },

  createStudent: async (data: StudentFormData): Promise<Student> => {
    try {
      // Validate parent ID is provided
      if (!data.parent) {
        throw new Error('Parent ID is required');
      }

      // Validate parent ID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data.parent)) {
        throw new Error('Invalid parent ID format');
      }

      const response = await apiClient.post<Student>('/students/', data);
      return response.data;
    } catch (error) {
      console.error('Error in createStudent:', error);
      throw error;
    }
  },

  updateStudent: async (id: string, data: Partial<StudentFormData>): Promise<Student> => {
    try {
      // If parent is being updated, validate the ID
      if (data.parent) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(data.parent)) {
          throw new Error('Invalid parent ID format');
        }
      }

      const response = await apiClient.patch<Student>(`/students/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error in updateStudent(${id}):`, error);
      throw error;
    }
  },

  deleteStudent: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/students/${id}/`);
    } catch (error) {
      console.error(`Error in deleteStudent(${id}):`, error);
      throw error;
    }
  },

  // Additional operations
  getStudentsByGrade: async (grade: number): Promise<Student[]> => {
    try {
      const response = await apiClient.get<Student[]>(`/students/grade/${grade}/`);
      return response.data;
    } catch (error) {
      console.error(`Error in getStudentsByGrade(${grade}):`, error);
      throw error;
    }
  },

  // Additional student-specific endpoints
  getStudentExamResults: async (studentId: string) => {
    const response = await apiClient.get(`/api/students/${studentId}/exam-results/`);
    return response.data;
  },

  getStudentFeeRecords: async (studentId: string) => {
    const response = await apiClient.get(`/students/${studentId}/fee-records/`);
    return response.data;
  },

  initiatePayment: async (studentId: string, paymentData: PaymentData) => {
    const response = await apiClient.post(`/api/students/${studentId}/initiate_payment/`, paymentData);
    return response.data;
  }
}; 