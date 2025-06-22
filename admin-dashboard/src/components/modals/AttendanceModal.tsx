import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import attendanceService, { AttendanceRecord } from '@/services/attendanceService';

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
  const queryClient = useQueryClient();

  // Get attendance summary for the selected date
  const { data: attendanceSummary, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate, className],
    queryFn: () => attendanceService.getClassAttendanceSummary(selectedDate),
    enabled: isOpen // Only fetch when modal is open
  });

  // Mutation for marking attendance
  const markAttendanceMutation = useMutation({
    mutationFn: (records: AttendanceRecord[]) => 
      attendanceService.markClassAttendance(selectedDate, records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedDate, className] });
      toast.success('Attendance marked successfully');
    },
    onError: (error: any) => {
      console.error('Error marking attendance:', error);
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  });

  const handleMarkAttendance = (studentId: string, status: AttendanceRecord['status'], reason: string = '') => {
    markAttendanceMutation.mutate([{ student_id: studentId, status, reason }]);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Background blur */}
      <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-50 p-2">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  {decodeURIComponent(className)} - Attendance
                </Dialog.Title>
                <p className="text-sm text-gray-500">
                  Mark and view attendance records
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* Date Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="date" className="text-sm font-medium text-gray-700">
                Select Date:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Attendance Summary */}
                {attendanceSummary && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="rounded-full bg-green-50 p-2">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Present</p>
                          <p className="text-lg font-semibold text-gray-900">{attendanceSummary.present}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="rounded-full bg-red-50 p-2">
                          <XCircleIcon className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Absent</p>
                          <p className="text-lg font-semibold text-gray-900">{attendanceSummary.absent}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="rounded-full bg-yellow-50 p-2">
                          <ClockIcon className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Late</p>
                          <p className="text-lg font-semibold text-gray-900">{attendanceSummary.late}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="rounded-full bg-blue-50 p-2">
                          <ExclamationCircleIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Excused</p>
                          <p className="text-lg font-semibold text-gray-900">{attendanceSummary.excused}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendance Records */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Recorded By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendanceSummary?.records.map((record) => (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.student_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ring-1 ring-inset ${statusColors[record.status]}`}>
                                {statusIcons[record.status]}
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.reason || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.recorded_by_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                {['present', 'absent', 'late', 'excused'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleMarkAttendance(record.student, status as AttendanceRecord['status'])}
                                    className={`p-1 rounded-md hover:bg-gray-100 ${
                                      record.status === status ? 'bg-gray-100' : ''
                                    }`}
                                    title={`Mark as ${status}`}
                                  >
                                    {statusIcons[status as keyof typeof statusIcons]}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {/* Unmarked Students */}
                        {attendanceSummary?.unmarked_students.map((student) => (
                          <tr key={student.id} className="bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Not marked
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                {['present', 'absent', 'late', 'excused'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleMarkAttendance(student.id, status as AttendanceRecord['status'])}
                                    className="p-1 rounded-md hover:bg-gray-100"
                                    title={`Mark as ${status}`}
                                  >
                                    {statusIcons[status as keyof typeof statusIcons]}
                                  </button>
                                ))}
                              </div>
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