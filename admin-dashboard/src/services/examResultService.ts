import { apiClient } from '../lib/api';

export interface ExamResult {
  id: string;
  student: string;
  student_name: string;
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

export interface ExamPDF {
  id: string;
  teacher_name: string;
  exam_name: string;
  subject: string;
  class_assigned: string;
  exam_date: string;
  year: number;
  file: string;
  remarks: string;
  download_url: string;
  created_at: string;
  school_name: string;
}

const examResultService = {
  // Get exam results - using the correct endpoint
  getExamResults: async () => {
    const response = await apiClient.get('/api/exams/record/');
    return { results: response.data };
  },

  // Get exam result by ID
  getExamResultById: async (id: string): Promise<ExamResult> => {
    const response = await apiClient.get(`/api/exams/record/${id}/`);
    return response.data;
  },

  // Create exam result
  createExamResult: async (data: Partial<ExamResult>): Promise<ExamResult> => {
    const response = await apiClient.post('/api/exams/record/', data);
    return response.data;
  },

  // Update exam result
  updateExamResult: async (id: string, data: Partial<ExamResult>): Promise<ExamResult> => {
    const response = await apiClient.put(`/api/exams/record/${id}/`, data);
    return response.data;
  },

  // Delete exam result
  deleteExamResult: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/exams/record/${id}/`);
  },

  // Download exam results
  downloadResults: async (): Promise<Blob> => {
    const response = await apiClient.get('/api/exams/record/download/', {
      responseType: 'blob'
    });
    return response.data;
  },

  // Download exam PDF
  downloadExamPDF: async (examId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/teacher/exams/${examId}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get all exam PDFs
  getExamPDFs: async (): Promise<ExamPDF[]> => {
    const response = await apiClient.get('/api/teacher/exams/');
    return response.data;
  },

  // Get recent exam PDFs
  getRecentExamPDFs: async (): Promise<ExamPDF[]> => {
    const response = await apiClient.get('/api/teacher/exams/recent/');
    return response.data;
  }
};

export default examResultService; 