export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  role: 'admin' | 'teacher' | 'parent';
  school: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  website?: string;
  logo?: string;
  registration_number: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  school: string;
  phone_number: string;
  profile_pic?: string;
  class_assigned?: string;
  subjects: string[];
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  name: string;
  guardian: string;
  contact: string;
  grade: number;
  class_assigned?: string;
  parent: string;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export interface ExamResult {
  id: string;
  student: string;
  exam_name: string;
  subject: string;
  marks: number;
  grade: string;
  term: string;
  year: number;
  remarks?: string;
  created_at: string;
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