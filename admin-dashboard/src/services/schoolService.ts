import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://educitebackend.co.ke/api';

export interface SchoolStatistics {
  total_teachers: number;
  total_students: number;
  total_parents: number;
  fee_collection: number;
  active_users: number;
  school_name: string;
}

export const schoolService = {
  getSchoolStatistics: async (): Promise<SchoolStatistics> => {
    // This will get stats for the authenticated school admin's school
    const response = await axios.get(`${API_URL}/school/statistics/`);
    return response.data;
  }
}; 