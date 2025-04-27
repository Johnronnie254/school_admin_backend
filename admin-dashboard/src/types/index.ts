import { AxiosError } from 'axios';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  tokens: {
    access: string;
    refresh: string;
  };
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'teacher' | 'student';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ConfirmResetData {
  token: string;
  password: string;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface School {
  id: number;
  name: string;
  registration_number: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSchoolData {
  name: string;
  registration_number: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
}

export interface UpdateSchoolData extends Partial<CreateSchoolData> {
  is_active?: boolean;
}

export interface ApiError extends AxiosError {
  message: string;
}

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

export interface Notification {
  id: string;
  message: string;
  target_group: 'all' | 'teachers' | 'students' | 'parents';
  created_at: string;
  created_by: string;
}

export interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface LeaveApplication {
  id: string;
  teacher: string;
  leave_type: 'sick' | 'casual' | 'emergency';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  file: string;
  document_type: 'report' | 'assignment' | 'syllabus' | 'other';
  uploaded_by: string;
  student?: string;
  created_at: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  event_type: 'holiday' | 'exam' | 'meeting' | 'activity';
  participants: 'all' | 'teachers' | 'students' | 'parents';
  created_by: string;
}

export interface TeacherParentAssociation {
  id: string;
  teacher: string;
  parent: string;
  created_at: string;
  is_active: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
} 