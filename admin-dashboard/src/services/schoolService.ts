import axios from 'axios';
import { CreateSchoolDto, School, SchoolsResponse, UpdateSchoolDto } from '../types/school';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://78.111.67.196/api';

export interface SchoolStatistics {
  total_schools: number;
  total_teachers: number;
  total_students: number;
  total_parents: number;
  fee_collection: number;
  active_users: number;
}

export const schoolService = {
  getSchools: async (page = 1): Promise<SchoolsResponse> => {
    const response = await axios.get(`${API_URL}/schools/?page=${page}`);
    return response.data;
  },

  getSchoolById: async (id: number): Promise<School> => {
    const response = await axios.get(`${API_URL}/schools/${id}/`);
    return response.data;
  },

  createSchool: async (data: CreateSchoolDto): Promise<School> => {
    const response = await axios.post(`${API_URL}/schools/`, data);
    return response.data;
  },

  updateSchool: async (id: number, data: UpdateSchoolDto): Promise<School> => {
    const response = await axios.patch(`${API_URL}/schools/${id}/`, data);
    return response.data;
  },

  deleteSchool: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/schools/${id}/`);
  },

  getStatistics: async (period: string): Promise<SchoolStatistics> => {
    const response = await axios.get(`${API_URL}/statistics/?period=${period}`);
    return response.data;
  }
}; 