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
}

class TeacherService {
  async getTeachers() {
    const response = await apiClient.get<PaginatedResponse<Teacher>>('/teachers/');
    return response.data;
  }

  async getTeacher(id: string) {
    const response = await apiClient.get<Teacher>(`/teachers/${id}/`);
    return response.data;
  }

  async createTeacher(data: Partial<Teacher>) {
    const response = await apiClient.post<Teacher>('/teachers/', data);
    return response.data;
  }

  async updateTeacher(id: string, data: Partial<Teacher>) {
    const response = await apiClient.put<Teacher>(`/teachers/${id}/`, data);
    return response.data;
  }

  async deleteTeacher(id: string) {
    await apiClient.delete(`/teachers/${id}/`);
  }

  // Additional teacher-specific endpoints
  async getTeachersBySubject(subject: string) {
    const response = await apiClient.get(`/teachers/by-subject/${subject}/`);
    return response.data;
  }

  async uploadProfilePic(file: File) {
    const formData = new FormData();
    formData.append('profile_pic', file);
    const response = await apiClient.post('/teacher/profile_pic/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getTeacherSchedule() {
    const response = await apiClient.get('/teacher/schedule/');
    return response.data;
  }
}

export const teacherService = new TeacherService(); 