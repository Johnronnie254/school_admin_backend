import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://educitebackend.co.ke/api';

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export interface ParentFormData {
  name: string;
  email: string;
  phone_number: string;
  password?: string;
}

export const parentService = {
  getParents: async () => {
    try {
      const response = await axios.get(`${API_URL}/parents/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getParentById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/parents/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  createParent: async (data: ParentFormData) => {
    try {
      const response = await axios.post(`${API_URL}/parents/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  updateParent: async (id: string, data: Partial<ParentFormData>) => {
    try {
      const response = await axios.put(`${API_URL}/parents/${id}/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  deleteParent: async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/parents/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getParentChildren: async (parentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/parents/${parentId}/children/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  }
}; 