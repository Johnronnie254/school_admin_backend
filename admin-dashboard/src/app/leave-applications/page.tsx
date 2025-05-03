'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApplicationService, type LeaveApplication, type CreateLeaveApplicationData } from '@/services/leaveApplicationService';
import { useForm, type SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  ClipboardDocumentCheckIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CalendarDaysIcon,
  FunnelIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Dialog } from '@/components/ui/dialog';

export default function LeaveApplicationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateLeaveApplicationData>();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    setUserRole(user?.role);
  }, []);

  // Redirect non-admin users
  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      toast.error('Access denied. Only administrators can view this page.');
      router.push('/dashboard');
    }
  }, [userRole, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['leaveApplications'],
    queryFn: leaveApplicationService.getLeaveApplications,
    enabled: userRole === 'admin'
  });
  
  // Extract applications from paginated response
  const applications: LeaveApplication[] = data?.results || [];

  // Filter applications by status
  const filteredApplications = statusFilter 
    ? applications.filter(app => app.status === statusFilter) 
    : applications;

  const createMutation = useMutation({
    mutationFn: leaveApplicationService.createLeaveApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveApplications'] });
      setIsModalOpen(false);
      reset();
      toast.success('Test leave application created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create test leave application');
      console.error('Error creating test leave application:', error);
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => leaveApplicationService.approveLeaveApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveApplications'] });
      toast.success('Leave application approved successfully');
    },
    onError: (error) => {
      toast.error('Failed to approve leave application');
      console.error('Error approving leave application:', error);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => leaveApplicationService.rejectLeaveApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveApplications'] });
      toast.success('Leave application rejected successfully');
    },
    onError: (error) => {
      toast.error('Failed to reject leave application');
      console.error('Error rejecting leave application:', error);
    }
  });

  const onSubmit: SubmitHandler<CreateLeaveApplicationData> = (data) => {
    createMutation.mutate(data);
  };

  // Get counts for each status
  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">Leave Applications</h1>
        </div>
        
        {/* Temporary Create Button (for testing) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Create Test Application
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FunnelIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              statusFilter === null
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
            }`}
          >
            All ({applications.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              statusFilter === 'pending'
                ? 'bg-yellow-500 text-white shadow-md'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:shadow-sm'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              statusFilter === 'approved'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-green-50 text-green-700 hover:bg-green-100 hover:shadow-sm'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-red-50 text-red-700 hover:bg-red-100 hover:shadow-sm'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {statusFilter 
              ? `No ${statusFilter} leave applications found` 
              : 'No leave applications found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter 
              ? `There are no ${statusFilter} leave applications at this time.` 
              : 'No leave applications have been submitted yet.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Create Test Application
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {/* Only show Actions column for pending applications or All filter */}
                {(statusFilter === 'pending' || statusFilter === null) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{application.teacher_name || 'Teacher'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{application.leave_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {new Date(application.start_date).toLocaleDateString()} - {new Date(application.end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-xs truncate">{application.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      application.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : application.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {application.status}
                    </span>
                  </td>
                  {/* Only show Actions column for pending applications */}
                  {(statusFilter === 'pending' || statusFilter === null) && application.status === 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approveMutation.mutate(application.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate(application.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                  {/* Add an empty cell for applications that aren't pending to maintain table layout */}
                  {(statusFilter === 'pending' || statusFilter === null) && application.status !== 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Test Create Leave Application Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-6 py-8 shadow-xl transition-all sm:w-full sm:max-w-lg">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="rounded-full bg-blue-50 p-2">
                <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              </div>
              <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900">
                Create Test Leave Application
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Leave Type
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    {...register('leave_type', { required: 'Leave type is required' })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">Select Leave Type</option>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="emergency">Emergency Leave</option>
                  </select>
                  {errors.leave_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.leave_type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('start_date', { required: 'Start date is required' })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                  {errors.start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('end_date', { required: 'End date is required' })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                  {errors.end_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    {...register('reason', { required: 'Reason is required' })}
                    rows={3}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Enter reason for leave"
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  disabled={createMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </div>
                  ) : (
                    'Create Application'
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 