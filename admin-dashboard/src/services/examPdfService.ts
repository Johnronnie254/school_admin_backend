import { apiClient } from '@/lib/api';

export interface ExamPDF {
  id: string;
  teacher: string;
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
  school: string;
  school_name: string;
}

export const examPdfService = {
  getExamPdfs: async () => {
    const response = await apiClient.get<ExamPDF[]>('/api/exam-pdfs/');
    return response.data;
  },

  downloadPdf: async (id: string) => {
    const response = await apiClient.get(`/api/exam-pdfs/${id}/download/`, {
      responseType: 'blob'
    });
    return response.data;
  },

  approvePdf: async (id: string) => {
    const response = await apiClient.post(`/api/exam-pdfs/${id}/approve/`);
    return response.data;
  },

  rejectPdf: async (id: string, remarks: string) => {
    const response = await apiClient.post(`/api/exam-pdfs/${id}/reject/`, { remarks });
    return response.data;
  }
}; 