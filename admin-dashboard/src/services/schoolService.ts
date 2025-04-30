import { apiClient } from '@/lib/api';

export interface SchoolStatistics {
  total_teachers: number;
  total_students: number;
  total_parents: number;
  active_users: number;
  students_per_grade: Array<{ grade: number; count: number }>;
  recent_notifications: Array<{
    message: string;
    target_group: string;
    created_at: string;
  }>;
  school_name: string;
}

export const schoolService = {
  getSchoolStatistics: async () => {
    const response = await apiClient.get<SchoolStatistics>('/api/statistics/');
    return response.data;
  }
};