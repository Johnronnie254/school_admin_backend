import { apiClient } from '@/lib/api';

export interface Attendance {
  id: string;
  student: string;
  student_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  reason: string;
  recorded_by: string;
  recorded_by_name: string;
  created_at: string;
}

export interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  reason?: string;
}

export interface ClassAttendanceSummary {
  total_students: number;
  attendance_marked: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  records: Attendance[];
  unmarked_students: {
    id: string;
    name: string;
    grade: number;
  }[];
}

const attendanceService = {
  // Get attendance records for a specific date
  getAttendance: async (date?: string, className?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (className) params.append('class_name', className);
    const response = await apiClient.get(`/attendance?${params.toString()}`);
    return response.data;
  },

  // Get attendance summary for a class
  getClassAttendanceSummary: async (date?: string, className?: string) => {
    try {
      console.log('Fetching attendance for:', { date, class: className });
      // Remove any trailing slashes from className
      const cleanClassName = className?.replace(/\/+$/, '');
      
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (cleanClassName) params.append('class_name', cleanClassName);
      
      const response = await apiClient.get<ClassAttendanceSummary>(`/attendance/class_attendance_summary?${params.toString()}`);
      console.log('Attendance API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }
  },

  // Mark attendance for multiple students
  markClassAttendance: async (date: string, attendance: AttendanceRecord[], className: string) => {
    try {
      // Remove any trailing slashes from className
      const cleanClassName = className.replace(/\/+$/, '');
      
      const response = await apiClient.post<{ message: string }>('/attendance/mark_class_attendance', {
        date,
        attendance,
        class_name: cleanClassName
      });
      return response.data;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  },

  // Get students in a class
  getClassStudents: async (className: string) => {
    try {
      // Remove any trailing slashes from className
      const cleanClassName = className.replace(/\/+$/, '');
      console.log('Fetching students with class:', cleanClassName);
      
      const params = new URLSearchParams();
      if (cleanClassName) {
        params.append('class_name', cleanClassName);
      }
      const response = await apiClient.get(`/teachers/my_class_students?${params.toString()}`);
      console.log('Students API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching class students:', error);
      throw error;
    }
  }
};

export default attendanceService; 