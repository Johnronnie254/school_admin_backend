'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApplicationService, type LeaveApplication } from '@/services/leaveApplicationService';
import toast from 'react-hot-toast';
import {
  ClipboardDocumentCheckIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CalendarDaysIcon,
  FunnelIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

export default function LeaveApplicationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
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

  const deleteSelectedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete selected applications one by one
      const deletePromises = ids.map(id => 
        leaveApplicationService.deleteLeaveApplication(id)
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveApplications'] });
      toast.success(`${selectedIds.size} leave application(s) deleted successfully`);
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error('Failed to delete selected leave applications');
      console.error('Error deleting selected leave applications:', error);
    }
  });

  // Commenting out unused mutation
  /*
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      // Delete all applications one by one
      const deletePromises = applications.map(app => 
        leaveApplicationService.deleteLeaveApplication(app.id)
      );
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveApplications'] });
      toast.success('All leave applications deleted successfully');
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error('Failed to delete leave applications');
      console.error('Error deleting leave applications:', error);
    }
  });
  */

  const deleteSingleMutation = useMutation({
    mutationFn: (id: string) => leaveApplicationService.deleteLeaveApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveApplications'] });
      toast.success('Leave application deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete leave application');
      console.error('Error deleting leave application:', error);
    }
  });

  // Confirm and delete all applications
  // Commented out to fix ESLint error - function is not currently used
  /* const handleClearAll = () => {
    if (applications.length === 0) {
      toast.error('No applications to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete all ${applications.length} leave applications? This action cannot be undone.`)) {
      deleteAllMutation.mutate();
    }
  }; */

  // Confirm and delete selected applications
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) {
      toast.error('No applications selected');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected leave application(s)? This action cannot be undone.`)) {
      deleteSelectedMutation.mutate(Array.from(selectedIds));
    }
  };

  // Handle single application delete
  const handleDeleteSingle = (id: string) => {
    if (window.confirm('Are you sure you want to delete this leave application? This action cannot be undone.')) {
      deleteSingleMutation.mutate(id);
    }
  };

  // Toggle selection of a single application
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle selection of all applications
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      // If all are selected, deselect all
      setSelectedIds(new Set());
    } else {
      // Otherwise select all filtered applications
      setSelectedIds(new Set(filteredApplications.map(app => app.id)));
    }
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
        
        <div className="flex gap-3">
          {/* Delete Selected Button - Only show when items are selected */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={deleteSelectedMutation.isPending}
            >
              <TrashIcon className="h-5 w-5" />
              {deleteSelectedMutation.isPending ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
            </button>
          )}

          {/* Clear All Button */}
          {/* <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={applications.length === 0 || deleteAllMutation.isPending}
          >
            <TrashIcon className="h-5 w-5" />
            {deleteAllMutation.isPending ? 'Deleting...' : 'Delete All'}
          </button> */}
        </div>
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
              </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="rounded p-1 hover:bg-gray-200 transition-colors"
                    title={selectedIds.size === filteredApplications.length ? "Deselect all" : "Select all"}
                  >
                    {selectedIds.size === filteredApplications.length && filteredApplications.length > 0 ? (
                      <div className="h-5 w-5 bg-blue-600 rounded flex items-center justify-center text-white">
                        <CheckIcon className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-400 rounded" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className={`hover:bg-gray-50 ${selectedIds.has(application.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-3 py-4">
                    <button 
                      onClick={() => toggleSelect(application.id)}
                      className="rounded p-1 hover:bg-gray-200 transition-colors"
                    >
                      {selectedIds.has(application.id) ? (
                        <div className="h-5 w-5 bg-blue-600 rounded flex items-center justify-center text-white">
                          <CheckIcon className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-400 rounded" />
                      )}
                    </button>
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {application.status === 'pending' && (
                        <>
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
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteSingle(application.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
            </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
    </div>
  );
} 