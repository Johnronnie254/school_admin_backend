import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://78.111.67.196/api';

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageFormData {
  receiver: string;
  content: string;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const messageService = {
  getMessages: async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getChatHistory: async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/messages/chat/${userId}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  sendMessage: async (data: MessageFormData) => {
    try {
      const response = await axios.post(`${API_URL}/messages/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  deleteMessage: async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/messages/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  // Get list of teachers or parents based on user role
  getChatUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/teacher-parent-associations/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  }
}; 