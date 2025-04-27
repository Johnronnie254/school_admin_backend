import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Class {
  id: string;
  name: string;
  teacher: string;
  students: string[];
  subjects: string[];
}

interface ClassFormData {
  name: string;
  teacher: string;
  subjects: string[];
}

export const classService = {
  getClasses: async () => {
    const response = await axios.get(`${API_URL}/api/classes/`);
    return response.data;
  },

  getClass: async (id: string) => {
    const response = await axios.get(`${API_URL}/api/classes/${id}/`);
    return response.data;
  },

  createClass: async (data: ClassFormData) => {
    const response = await axios.post(`${API_URL}/api/classes/`, data);
    return response.data;
  },

  updateClass: async (id: string, data: Partial<ClassFormData>) => {
    const response = await axios.put(`${API_URL}/api/classes/${id}/`, data);
    return response.data;
  },

  deleteClass: async (id: string) => {
    await axios.delete(`${API_URL}/api/classes/${id}/`);
  }
}; 