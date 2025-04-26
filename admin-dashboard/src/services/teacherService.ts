import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api';

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

export const teacherService = {
  // Main CRUD operations
  getTeachers: async () => {
    try {
      const response = await apiClient.get('/teachers/');
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching teachers:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getTeacherById: async (id: string) => {
    try {
      const response = await apiClient.get(`/teachers/${id}/`);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error fetching teacher ${id}:`, error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  createTeacher: async (data: TeacherFormData) => {
    try {
      const response = await apiClient.post('/teachers/', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error creating teacher:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  updateTeacher: async (id: string, data: TeacherFormData) => {
    try {
      const response = await apiClient.put(`/teachers/${id}/`, data);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error updating teacher ${id}:`, error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  deleteTeacher: async (id: string) => {
    try {
      const response = await apiClient.delete(`/teachers/${id}/`);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error deleting teacher ${id}:`, error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  // Additional teacher-specific endpoints
  getTeachersBySubject: async (subject: string) => {
    try {
      const response = await apiClient.get(`/teachers/by-subject/${subject}/`);
      return response.data;
    } catch (error: unknown) {
      console.error(`Error fetching teachers by subject ${subject}:`, error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  uploadProfilePic: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('profile_pic', file);
      const response = await apiClient.post('/teacher/profile_pic/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: unknown) {
      console.error('Error uploading profile picture:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getTeacherSchedule: async () => {
    try {
      const response = await apiClient.get('/teacher/schedule/');
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching teacher schedule:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },
}; 