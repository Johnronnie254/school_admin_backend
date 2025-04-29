import { apiClient} from '@/lib/api';

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
  getMessages: async (userId: string) => {
    const response = await apiClient.get<Message[]>(`/api/messages/chat/${userId}/`);
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

  deleteMessage: async (messageId: string) => {
    await apiClient.delete(`/api/messages/${messageId}/`);
  },

  // Get all users for messaging
  getChatUsers: async () => {
    const response = await apiClient.get<{ teachers: ChatUser[], parents: ChatUser[] }>('/api/admin/users/');
    // Combine teachers and parents into a single array
    return [...response.data.teachers, ...response.data.parents];
  }
}; 