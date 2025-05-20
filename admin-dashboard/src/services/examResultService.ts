import { apiClient } from '@/lib/api';

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
      // Use the new endpoint to get all exam results
      const response = await apiClient.get<ExamResult[]>('/api/exams/record/');
      return { results: response.data };
    } catch (error) {
      console.error('Error fetching exam results:', error);
      // Fallback to previous method if the endpoint fails
      console.log('Falling back to student-by-student exam results fetching...');
      return examResultService.getExamResultsFallback();
    }
  },

  // Fallback method using the previous approach
  getExamResultsFallback: async () => {
    const studentsResponse = await apiClient.get('/api/students/');
    const students = studentsResponse.data.results || [];
    
    const allResults = [];
    for (const student of students) {
      try {
        const studentResults = await examResultService.getStudentExamResults(student.id);
        allResults.push(...studentResults);
      } catch (error) {
        console.error(`Error fetching results for student ${student.id}:`, error);
      }
    }
    
    return { results: allResults };
  },

  getExamResultById: async (id: string) => {
    const response = await examResultService.getExamResults();
    const result = response.results.find(result => result.id === id);
    if (!result) {
      throw new Error(`Exam result with ID ${id} not found`);
    }
    return result;
  },

  createExamResult: async (data: ExamResultFormData) => {
    const response = await apiClient.post<ExamResult>('/api/exams/record/', data);
    return response.data;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateExamResult: async (id: string, data: Partial<ExamResultFormData>) => {
    throw new Error('Update exam result endpoint not implemented in backend');
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteExamResult: async (id: string) => {
    throw new Error('Delete exam result endpoint not implemented in backend');
  },

  getStudentExamResults: async (studentId: string) => {
    const response = await apiClient.get<ExamResult[]>(`/api/students/${studentId}/exam-results/`);
    return response.data;
  },

  downloadResults: async () => {
    throw new Error('Download exam results endpoint not implemented in backend');
  }
}; 