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
  receiver_email?: string;
  receiver_role?: string;
  receiver_name?: string;
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
  phone_number: string;
  created_at: string;
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
    // Log the exact data being sent
    console.log('🔍 SENDING MESSAGE WITH DATA:', JSON.stringify(data, null, 2));
    try {
      const response = await apiClient.post<Message>('/api/messages/', data);
      console.log('✅ MESSAGE SENT SUCCESSFULLY:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ MESSAGE SEND ERROR:', error);
      console.error('❌ REQUEST DATA WAS:', data);
      
      // Try direct message endpoint as a fallback
      try {
        console.log('🔄 ATTEMPTING DIRECT MESSAGE FALLBACK');
        const directResponse = await messageService.sendDirectMessage(data);
        console.log('✅ DIRECT MESSAGE SENT SUCCESSFULLY:', directResponse);
        return directResponse;
      } catch (directError) {
        console.error('❌ DIRECT MESSAGE ALSO FAILED:', directError);
        throw error; // Re-throw the original error
      }
    }
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

      // Get parents using the same endpoint as parents page
      const parentsResponse = await apiClient.get<PaginatedResponse<Parent>>('/api/parents/');
      const parents = parentsResponse.data.results || [];

      // Transform teachers to include role for UI consistency
      const teachersWithRole = teachers.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher'
      }));

      // Transform parents to include role for UI consistency
      const parentsWithRole = parents.map(parent => ({
        id: parent.id,
        name: parent.name,
        email: parent.email,
        role: 'parent'
      }));

      // Return combined array of teachers and parents
      return [...teachersWithRole, ...parentsWithRole];
    } catch (error) {
      console.error('Error fetching chat users:', error);
      return [];
    }
  },

  // New direct message function that bypasses model validation
  sendDirectMessage: async (data: MessageFormData) => {
    console.log('🔍 SENDING DIRECT MESSAGE WITH DATA:', JSON.stringify(data, null, 2));
    try {
      const response = await apiClient.post<Message>('/api/messages/direct_message/', data);
      console.log('✅ DIRECT MESSAGE SENT SUCCESSFULLY:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ DIRECT MESSAGE ERROR:', error);
      console.error('❌ DIRECT MESSAGE REQUEST DATA WAS:', data);
      throw error;
    }
  }
}; 