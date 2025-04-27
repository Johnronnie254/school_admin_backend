import { apiClient, PaginatedResponse } from '@/lib/api';

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
    const response = await apiClient.get<PaginatedResponse<ExamResult>>('/api/exam-results/');
    return response.data;
  },

  getExamResultById: async (id: string) => {
    const response = await apiClient.get<ExamResult>(`/api/exam-results/${id}/`);
    return response.data;
  },

  createExamResult: async (data: ExamResultFormData) => {
    const response = await apiClient.post<ExamResult>('/api/exam-results/', data);
    return response.data;
  },

  updateExamResult: async (id: string, data: Partial<ExamResultFormData>) => {
    const response = await apiClient.put<ExamResult>(`/api/exam-results/${id}/`, data);
    return response.data;
  },

  deleteExamResult: async (id: string) => {
    await apiClient.delete(`/api/exam-results/${id}/`);
  },

  getStudentExamResults: async (studentId: string) => {
    const response = await apiClient.get<ExamResult[]>(`/api/students/${studentId}/exam-results/`);
    return response.data;
  },

  downloadResults: async () => {
    const response = await apiClient.get('/api/exam-results/download/', {
      responseType: 'blob'
    });
    return response.data;
  }
}; 