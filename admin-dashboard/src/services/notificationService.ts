import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://educitebackend.co.ke/api';

export interface Notification {
  id: string;
  message: string;
  target_group: 'all' | 'teachers' | 'students' | 'parents';
  created_at: string;
  created_by: string | null;
}

export interface NotificationFormData {
  message: string;
  target_group: 'all' | 'teachers' | 'students' | 'parents';
}

export const notificationService = {
  getNotifications: async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getNotificationById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/notifications/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  createNotification: async (data: NotificationFormData) => {
    try {
      const response = await axios.post(`${API_URL}/notifications/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  updateNotification: async (id: string, data: Partial<NotificationFormData>) => {
    try {
      const response = await axios.put(`${API_URL}/notifications/${id}/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/notifications/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  }
}; 