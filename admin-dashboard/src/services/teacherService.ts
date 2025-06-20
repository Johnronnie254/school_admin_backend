import { apiClient, PaginatedResponse } from '@/lib/api';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  class_assigned: string | null;
  subjects: string[];
  profile_pic?: string;
  school: string;
}

export interface TeacherFormData {
  name: string;
  email: string;
  phone_number: string;
  class_assigned: string;
  subjects: string[];
  password?: string;
  password_confirmation?: string;
}

class TeacherService {
  async getTeachers(): Promise<PaginatedResponse<Teacher>> {
    try {
      const response = await apiClient.get<Teacher[] | PaginatedResponse<Teacher>>('/api/teachers/');
      console.log('Teacher service response:', response.data);
      
      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        // Direct array response (when pagination_class = None)
        return {
          count: response.data.length,
          next: null,
          previous: null,
          results: response.data
        };
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        // Paginated response format
        return {
          count: response.data.count || 0,
          next: response.data.next || null,
          previous: response.data.previous || null,
          results: Array.isArray(response.data.results) ? response.data.results : []
        };
      }
      
      console.error('Malformed response in getTeachers:', response);
      return { count: 0, next: null, previous: null, results: [] };
    } catch (error) {
      console.error('Error fetching teachers:', error);
      // Return an empty paginated response instead of undefined
      return { count: 0, next: null, previous: null, results: [] };
    }
  }

  async getTeacher(id: string) {
    const response = await apiClient.get<Teacher>(`/api/teachers/${id}/`);
    return response.data;
  }

  async createTeacher(data: Partial<Teacher>) {
    const response = await apiClient.post<Teacher>('/api/teachers/', data);
    return response.data;
  }

  async updateTeacher(id: string, data: Partial<Teacher>) {
    const response = await apiClient.patch<Teacher>(`/api/teachers/${id}/`, data);
    return response.data;
  }

  async deleteTeacher(id: string) {
    await apiClient.delete(`/api/teachers/${id}/`);
  }

  // Additional teacher-specific endpoints
  async getTeachersBySubject(subject: string) {
    const response = await apiClient.get(`/api/teachers/by-subject/${subject}/`);
    return response.data;
  }

  async uploadProfilePic(file: File) {
    const formData = new FormData();
    formData.append('profile_pic', file);
    const response = await apiClient.post('/api/teacher/profile_pic/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getTeacherSchedule() {
    const response = await apiClient.get('/api/teacher/schedule/');
    return response.data;
  }
}

export const teacherService = new TeacherService(); 