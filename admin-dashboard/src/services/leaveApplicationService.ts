import { apiClient, PaginatedResponse } from '@/lib/api';
import { AxiosError } from 'axios';

export interface LeaveApplication {
  id: string;
  teacher: string;
  teacher_name?: string;
  leave_type: 'sick' | 'casual' | 'emergency';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface CreateLeaveApplicationData {
  leave_type: 'sick' | 'casual' | 'emergency';
  start_date: string;
  end_date: string;
  reason: string;
}

export const leaveApplicationService = {
  getLeaveApplications: async (): Promise<PaginatedResponse<LeaveApplication>> => {
    try {
      console.log('Fetching leave applications...');
      const response = await apiClient.get<PaginatedResponse<LeaveApplication>>('leave-applications');
      console.log('Leave applications response:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching leave applications:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getLeaveApplicationById: async (id: string): Promise<LeaveApplication> => {
    try {
      const response = await apiClient.get<LeaveApplication>(`leave-applications/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  createLeaveApplication: async (data: CreateLeaveApplicationData): Promise<LeaveApplication> => {
    try {
      console.log('Creating leave application with data:', data);
      const response = await apiClient.post<LeaveApplication>('leave-applications', data);
      console.log('Create leave application response:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error creating leave application:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  updateLeaveApplication: async (id: string, data: Partial<CreateLeaveApplicationData>): Promise<LeaveApplication> => {
    try {
      const response = await apiClient.put<LeaveApplication>(`leave-applications/${id}`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  deleteLeaveApplication: async (id: string): Promise<void> => {
    try {
      console.log(`Deleting leave application with ID: ${id}`);
      await apiClient.delete(`leave-applications/${id}`);
    } catch (error: unknown) {
      console.error('Error deleting leave application:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  approveLeaveApplication: async (id: string): Promise<LeaveApplication> => {
    try {
      console.log(`Approving leave application with ID: ${id}`);
      const response = await apiClient.post<LeaveApplication>(`leave-applications/${id}/approve`);
      console.log('Approve leave application response:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error approving leave application:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  rejectLeaveApplication: async (id: string): Promise<LeaveApplication> => {
    try {
      console.log(`Rejecting leave application with ID: ${id}`);
      const response = await apiClient.post<LeaveApplication>(`leave-applications/${id}/reject`);
      console.log('Reject leave application response:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error rejecting leave application:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },
  
  getTeacherLeaveApplications: async (): Promise<PaginatedResponse<LeaveApplication>> => {
    try {
      console.log('Fetching teacher\'s leave applications...');
      // The backend automatically filters by the authenticated teacher
      const response = await apiClient.get<PaginatedResponse<LeaveApplication>>('leave-applications');
      console.log('Teacher leave applications response:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching teacher leave applications:', error);
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  }
}; 