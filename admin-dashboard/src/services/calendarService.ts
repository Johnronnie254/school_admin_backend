import api from './api';

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
  getEvents: () => {
    return api.get<SchoolEvent[]>('/api/events/');
  },

  getEvent: (id: string) => {
    return api.get<SchoolEvent>(`/api/events/${id}/`);
  },

  createEvent: (data: CreateEventData) => {
    return api.post<SchoolEvent>('/api/events/', data);
  },

  updateEvent: (id: string, data: CreateEventData) => {
    return api.put<SchoolEvent>(`/api/events/${id}/`, data);
  },

  deleteEvent: (id: string) => {
    return api.delete(`/api/events/${id}/`);
  },
};

export default calendarService; 