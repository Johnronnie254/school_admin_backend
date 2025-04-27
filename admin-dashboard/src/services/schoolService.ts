import { apiClient } from '@/lib/api';

export interface SchoolStatistics {
  total_teachers: number;
  total_students: number;
  total_parents: number;
  fee_collection: number;
  active_users: number;
  school_name: string;
}

export const schoolService = {
  getSchoolStatistics: async () => {
    const response = await apiClient.get<SchoolStatistics>('/statistics/');
    return response.data;
  }
};