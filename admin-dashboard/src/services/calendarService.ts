import api from '@/services/api';
import { AxiosResponse } from 'axios';

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
  getEvents: (): Promise<AxiosResponse<SchoolEvent[]>> => {
    return api.get('/api/events/');
  },

  getEvent: (id: string): Promise<AxiosResponse<SchoolEvent>> => {
    return api.get(`/api/events/${id}/`);
  },

  createEvent: (data: CreateEventData): Promise<AxiosResponse<SchoolEvent>> => {
    return api.post('/api/events/', data);
  },

  updateEvent: (id: string, data: CreateEventData): Promise<AxiosResponse<SchoolEvent>> => {
    return api.put(`/api/events/${id}/`, data);
  },

  deleteEvent: (id: string): Promise<AxiosResponse<void>> => {
    return api.delete(`/api/events/${id}/`);
  },
};

export default calendarService; 