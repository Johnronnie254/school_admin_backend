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
  getAttendance: async (date?: string) => {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get(`/attendance${params}`);
    return response.data;
  },

  // Get attendance summary for a class
  getClassAttendanceSummary: async (date?: string) => {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get<ClassAttendanceSummary>(`/attendance/class_attendance_summary${params}`);
    return response.data;
  },

  // Mark attendance for multiple students
  markClassAttendance: async (date: string, attendance: AttendanceRecord[]) => {
    const response = await apiClient.post('/attendance/mark_class_attendance/', {
      date,
      attendance
    });
    return response.data;
  }
};

export default attendanceService; 