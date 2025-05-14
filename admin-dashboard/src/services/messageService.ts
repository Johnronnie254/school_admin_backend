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

export interface Parent {
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
    try {
      // Get teachers using the correct endpoint
      const teachersResponse = await apiClient.get<PaginatedResponse<Teacher>>('/api/teachers/');
      const teachers = teachersResponse.data.results || [];

      // Get parents (keeping existing endpoint for now)
      const parentsResponse = await apiClient.get<{ parents: Parent[] }>('/api/admin/users/');
      const parents = parentsResponse.data.parents || [];

      // Transform teachers to include role for UI consistency
      const teachersWithRole = teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher'
      }));

      // Return combined array of teachers and parents
      return [...teachersWithRole, ...parents];
    } catch (error) {
      console.error('Error fetching chat users:', error);
      return [];
    }
  }
}; 