import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import attendanceService, { Attendance } from '@/services/attendanceService';


interface Student {
  id: string;
  name: string;
  grade: number;
}

interface StudentWithAttendance extends Student {
  attendance: Attendance | null;
}

const statusIcons = {
  present: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  absent: <XCircleIcon className="w-5 h-5 text-red-500" />,
  late: <ClockIcon className="w-5 h-5 text-yellow-500" />,
  excused: <ExclamationCircleIcon className="w-5 h-5 text-blue-500" />
};

const statusColors = {
  present: 'bg-green-50 text-green-700 ring-green-600/20',
  absent: 'bg-red-50 text-red-700 ring-red-600/20',
  late: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  excused: 'bg-blue-50 text-blue-700 ring-blue-600/20'
};

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
}

export default function AttendanceModal({ isOpen, onClose, className }: AttendanceModalProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  console.log('Modal Props:', { isOpen, className, selectedDate });

  // Get class students
  const { data: classData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-students', className],
    queryFn: async () => {
      console.log('Fetching students for class:', className);
      try {
        const data = await attendanceService.getClassStudents(className);
        console.log('Received class data:', data);
        if (!data || !data.students || !Array.isArray(data.students)) {
          console.warn('Invalid or empty class data received:', data);
          return { students: [], class_name: className, total_students: 0 };
        }
        return data;
      } catch (error) {
        console.error('Error fetching class students:', error);
        throw error;
      }
    },
    enabled: isOpen && !!className
  });

  // Get attendance summary for the selected date
  const { data: attendanceSummary, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', selectedDate, className],
    queryFn: async () => {
      console.log('Fetching attendance for:', { date: selectedDate, class: className });
      const data = await attendanceService.getClassAttendanceSummary(selectedDate, className);
      console.log('Received attendance data:', data);
      return data;
    },
    enabled: isOpen && !!className && !!classData
  });

  const isLoading = isLoadingStudents || isLoadingAttendance;
  console.log('Loading state:', { isLoadingStudents, isLoadingAttendance, isLoading });

  // Combine class students with attendance data
  const students = classData?.students || [];
  const attendanceRecords = attendanceSummary?.records || [];
  
  console.log('Processing data:', {
    hasClassData: !!classData,
    studentCount: students.length,
    hasAttendanceSummary: !!attendanceSummary,
    recordCount: attendanceRecords.length
  });

  const studentAttendance = students.map((student: Student): StudentWithAttendance => {
    const attendance = attendanceRecords.find(record => record.student === student.id);
    return {
      ...student,
      attendance: attendance || null
    };
  });

  console.log('Combined Student Attendance:', studentAttendance);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-blue-100/50">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-blue-50 transition-all duration-200 z-10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="px-6 py-6 border-b border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-blue-100/30 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-soft backdrop-blur-sm">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-blue-600">
                  {decodeURIComponent(className)} - Attendance
                </Dialog.Title>
                <p className="text-sm text-gray-600 mt-1">
                  View and track student attendance records
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* Date Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-blue-50/50 backdrop-blur-sm border border-blue-100/50">
              <label htmlFor="date" className="text-sm font-semibold text-gray-700">
                Select Date:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
              />
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
                <p className="text-sm text-gray-500 mt-4">Loading attendance data...</p>
              </div>
            ) : (
              <>
                {/* Attendance Summary */}
                {attendanceSummary && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-green-50/70 backdrop-blur-sm rounded-xl p-4 border border-green-100/50 shadow-soft">
                      <div className="flex items-center">
                        <div className="rounded-lg bg-green-100 p-3">
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-green-700">Present</p>
                          <p className="text-2xl font-bold text-gray-900">{attendanceSummary.present}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50/70 backdrop-blur-sm rounded-xl p-4 border border-red-100/50 shadow-soft">
                      <div className="flex items-center">
                        <div className="rounded-lg bg-red-100 p-3">
                          <XCircleIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-red-700">Absent</p>
                          <p className="text-2xl font-bold text-gray-900">{attendanceSummary.absent}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50/70 backdrop-blur-sm rounded-xl p-4 border border-yellow-100/50 shadow-soft">
                      <div className="flex items-center">
                        <div className="rounded-lg bg-yellow-100 p-3">
                          <ClockIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-yellow-700">Late</p>
                          <p className="text-2xl font-bold text-gray-900">{attendanceSummary.late}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50/70 backdrop-blur-sm rounded-xl p-4 border border-blue-100/50 shadow-soft">
                      <div className="flex items-center">
                        <div className="rounded-lg bg-blue-100 p-3">
                          <ExclamationCircleIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-blue-700">Excused</p>
                          <p className="text-2xl font-bold text-gray-900">{attendanceSummary.excused}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Student List */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-soft overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-blue-100/50">
                      <thead className="bg-gradient-to-r from-blue-50/80 to-blue-100/60 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                            Student Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                            Recorded By
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-blue-100/30">
                        {studentAttendance.map((student: StudentWithAttendance) => (
                          <tr key={student.id} className={`hover:bg-blue-50/30 transition-colors duration-200 ${!student.attendance ? 'bg-gray-50/50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {student.attendance ? (
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-inset font-medium ${statusColors[student.attendance.status]} backdrop-blur-sm`}>
                                  {statusIcons[student.attendance.status]}
                                  {student.attendance.status.charAt(0).toUpperCase() + student.attendance.status.slice(1)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200 font-medium">
                                  Not marked
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {student.attendance?.reason || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {student.attendance?.recorded_by_name || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 