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
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (className) params.append('class_name', className);
    const response = await apiClient.get<ClassAttendanceSummary>(`/attendance/class_attendance_summary?${params.toString()}`);
    return response.data;
  },

  // Mark attendance for multiple students
  markClassAttendance: async (date: string, attendance: AttendanceRecord[], className: string) => {
    const response = await apiClient.post('/attendance/mark_class_attendance/', {
      date,
      attendance,
      class_name: className
    });
    return response.data;
  },

  // Get students in a class
  getClassStudents: async (className: string) => {
    try {
      console.log('Fetching students with class:', className);
      const response = await apiClient.get(`/teachers/my_class_students?class_name=${encodeURIComponent(className)}`);
      console.log('Students API Response:', response.data);

      // Handle both array and paginated response formats
      const students = Array.isArray(response.data) ? response.data : response.data.results || [];
      const totalStudents = Array.isArray(response.data) ? response.data.length : response.data.count || students.length;

      const result = {
        class_name: className,
        total_students: totalStudents,
        students: students
      };
      console.log('Processed class data:', result);
      return result;
    } catch (error) {
      console.error('Error fetching class students:', error);
      throw error;
    }
  }
};

export default attendanceService; 