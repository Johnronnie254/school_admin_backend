import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://educitebackend.co.ke/api';

export interface ExamResult {
  id: string;
  student: string;
  exam_name: string;
  subject: string;
  marks: number;
  grade: string;
  term: string;
  year: number;
  remarks: string;
  created_at: string;
}

export interface ExamResultFormData {
  student: string;
  exam_name: string;
  subject: string;
  marks: number;
  grade: string;
  term: string;
  year: number;
  remarks?: string;
}

export const examResultService = {
  getExamResults: async () => {
    try {
      const response = await axios.get(`${API_URL}/exam-results/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getExamResultById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/exam-results/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  createExamResult: async (data: ExamResultFormData) => {
    try {
      const response = await axios.post(`${API_URL}/exam-results/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  updateExamResult: async (id: string, data: Partial<ExamResultFormData>) => {
    try {
      const response = await axios.put(`${API_URL}/exam-results/${id}/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  deleteExamResult: async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/exam-results/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

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

  downloadResults: async () => {
    try {
      const response = await axios.get(`${API_URL}/exam-results/download/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  }
}; 