import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://educitebackend.co.ke/api';

export interface SchoolFee {
  id: string;
  student: string;
  amount: number;
  term: string;
  year: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface SchoolFeeFormData {
  student: string;
  amount: number;
  term: string;
  year: number;
  payment_method: string;
}

export interface PaymentInitiationResponse {
  transaction_id: string;
  status: string;
  message: string;
}

export const schoolFeeService = {
  getSchoolFees: async () => {
    try {
      const response = await axios.get(`${API_URL}/school-fees/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getSchoolFeeById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/school-fees/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  createSchoolFee: async (data: SchoolFeeFormData) => {
    try {
      const response = await axios.post(`${API_URL}/fees/initiate/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  updateSchoolFee: async (id: string, data: Partial<SchoolFeeFormData>) => {
    try {
      const response = await axios.put(`${API_URL}/school-fees/${id}/`, data);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  deleteSchoolFee: async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/school-fees/${id}/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  getStudentFeeRecords: async (studentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/students/${studentId}/fee-records/`);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  downloadFeeRecords: async () => {
    try {
      const response = await axios.get(`${API_URL}/school-fees/download/`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  initiatePayment: async (studentId: string, data: SchoolFeeFormData) => {
    try {
      const response = await axios.post(`${API_URL}/students/${studentId}/initiate_payment/`, data);
      return response.data as PaymentInitiationResponse;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  confirmPayment: async (transactionId: string) => {
    try {
      const response = await axios.post(`${API_URL}/fees/confirm/`, {
        transaction_id: transactionId
      });
      return response.data;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  },

  initiateFeePayment: async (data: SchoolFeeFormData) => {
    try {
      const response = await axios.post(`${API_URL}/fees/initiate/`, data);
      return response.data as PaymentInitiationResponse;
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        throw error.response?.data || error.message;
      }
      throw error;
    }
  }
}; 