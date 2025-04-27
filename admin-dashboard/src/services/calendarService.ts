import { apiClient, PaginatedResponse } from '@/lib/api';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  event_type: 'holiday' | 'exam' | 'meeting' | 'activity';
  participants: 'all' | 'teachers' | 'students' | 'parents';
  created_by?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  event_type: SchoolEvent['event_type'];
  participants: SchoolEvent['participants'];
}

const calendarService = {
  getEvents: async () => {
    const response = await apiClient.get<PaginatedResponse<SchoolEvent>>('/api/events/');
    return response.data;
  },

  getEvent: async (id: string) => {
    const response = await apiClient.get<SchoolEvent>(`/api/events/${id}/`);
    return response.data;
  },

  createEvent: async (data: CreateEventData) => {
    const response = await apiClient.post<SchoolEvent>('/api/events/', data);
    return response.data;
  },

  updateEvent: async (id: string, data: CreateEventData) => {
    const response = await apiClient.put<SchoolEvent>(`/api/events/${id}/`, data);
    return response.data;
  },

  deleteEvent: async (id: string) => {
    await apiClient.delete(`/api/events/${id}/`);
  },
};

export default calendarService; 