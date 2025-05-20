import { AxiosError } from 'axios';
import { apiClient as api } from '@/lib/api';

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

export interface NotificationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

export const notificationService = {
  getNotifications: async () => {
    try {
      const response = await api.get<NotificationResponse>('/api/notifications/');
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
      const response = await api.get(`/api/notifications/${id}/`);
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
      const response = await api.post('/api/notifications/', data);
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
      const response = await api.put(`/api/notifications/${id}/`, data);
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
      const response = await api.delete(`/api/notifications/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  }
}; 