import { apiClient, PaginatedResponse } from '@/lib/api';

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
    const response = await apiClient.get<PaginatedResponse<Message>>('/api/messages/');
    return response.data;
  },

  getChatHistory: async (userId: string) => {
    const response = await apiClient.get<Message[]>(`/api/messages/chat/${userId}/`);
    return response.data;
  },

  sendMessage: async (data: MessageFormData) => {
    const response = await apiClient.post<Message>('/api/messages/', data);
    return response.data;
  },

  deleteMessage: async (id: string) => {
    await apiClient.delete(`/api/messages/${id}/`);
  },

  // Get list of teachers or parents based on user role
  getChatUsers: async () => {
    const response = await apiClient.get<ChatUser[]>('/api/teacher-parent-associations/');
    return response.data;
  }
}; 