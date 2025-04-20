import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://78.111.67.196/api';

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
      const response = await axios.get(`${API_URL}/teachers/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getTeacherById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/teachers/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  createTeacher: async (data: TeacherFormData) => {
    try {
      const response = await axios.post(`${API_URL}/teachers/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  updateTeacher: async (id: string, data: TeacherFormData) => {
    try {
      const response = await axios.put(`${API_URL}/teachers/${id}/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  deleteTeacher: async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/teachers/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  // Additional teacher-specific endpoints
  getTeachersBySubject: async (subject: string) => {
    try {
      const response = await axios.get(`${API_URL}/teachers/by-subject/${subject}/`);
      return response.data;
    } catch (error: unknown) {
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
      const response = await axios.post(`${API_URL}/teacher/profile_pic/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getTeacherSchedule: async () => {
    try {
      const response = await axios.get(`${API_URL}/teacher/schedule/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },
}; 