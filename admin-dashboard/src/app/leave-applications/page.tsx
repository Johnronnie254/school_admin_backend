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
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 p-8 shadow-soft backdrop-blur-sm border border-red-200/20 max-w-md w-full text-center">
          <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
        <p className="text-sm text-gray-500 mt-4">Loading leave applications...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-soft backdrop-blur-sm">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Leave Applications</h1>
            <p className="text-sm text-gray-600 mt-1">Review and manage teacher leave requests</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {/* Delete Selected Button - Only show when items are selected */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold rounded-xl hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-soft backdrop-blur-sm transition-all duration-200"
              disabled={deleteSelectedMutation.isPending}
            >
              <TrashIcon className="h-5 w-5" />
              {deleteSelectedMutation.isPending ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-blue-100 p-2">
            <FunnelIcon className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Filter by status:</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-soft backdrop-blur-sm ${
              statusFilter === null
                ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white'
                : 'bg-gray-100/70 text-gray-700 hover:bg-gray-200/70 border border-gray-200/50'
            }`}
          >
            All ({applications.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-soft backdrop-blur-sm ${
              statusFilter === 'pending'
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-white'
                : 'bg-yellow-50/70 text-yellow-700 hover:bg-yellow-100/70 border border-yellow-200/50'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-soft backdrop-blur-sm ${
              statusFilter === 'approved'
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                : 'bg-green-50/70 text-green-700 hover:bg-green-100/70 border border-green-200/50'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-soft backdrop-blur-sm ${
              statusFilter === 'rejected'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                : 'bg-red-50/70 text-red-700 hover:bg-red-100/70 border border-red-200/50'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-16">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 shadow-soft backdrop-blur-sm border border-blue-200/20 max-w-md mx-auto">
            <CalendarDaysIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-600 mb-2">
              {statusFilter 
                ? `No ${statusFilter} leave applications found` 
                : 'No leave applications found'}
            </h3>
            <p className="text-sm text-gray-600">
              {statusFilter 
                ? `There are no ${statusFilter} leave applications at this time.` 
                : 'No leave applications have been submitted yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border border-blue-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-100/50">
              <thead className="bg-gradient-to-r from-blue-50/80 to-blue-100/60 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-4 text-left">
                    <button
                      onClick={toggleSelectAll}
                      className="rounded-lg p-2 hover:bg-blue-100 transition-colors duration-200"
                      title={selectedIds.size === filteredApplications.length ? "Deselect all" : "Select all"}
                    >
                      {selectedIds.size === filteredApplications.length && filteredApplications.length > 0 ? (
                        <div className="h-5 w-5 bg-blue-600 rounded flex items-center justify-center text-white shadow-soft">
                          <CheckIcon className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 border-2 border-blue-400 rounded shadow-soft bg-white/50" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-blue-100/30">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className={`hover:bg-blue-50/30 transition-colors duration-200 ${selectedIds.has(application.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => toggleSelect(application.id)}
                        className="rounded-lg p-2 hover:bg-blue-100 transition-colors duration-200"
                      >
                        {selectedIds.has(application.id) ? (
                          <div className="h-5 w-5 bg-blue-600 rounded flex items-center justify-center text-white shadow-soft">
                            <CheckIcon className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 border-2 border-blue-400 rounded shadow-soft bg-white/50" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{application.teacher_name || 'Teacher'}</div>
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
                      <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-lg shadow-soft backdrop-blur-sm ${
                        application.status === 'approved' 
                          ? 'bg-green-100/80 text-green-800 border border-green-200/50'
                          : application.status === 'rejected'
                          ? 'bg-red-100/80 text-red-800 border border-red-200/50'
                          : 'bg-yellow-100/80 text-yellow-800 border border-yellow-200/50'
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
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-semibold rounded-lg hover:from-green-700 hover:to-green-600 shadow-soft transition-all duration-200"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(application.id)}
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold rounded-lg hover:from-red-700 hover:to-red-600 shadow-soft transition-all duration-200"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteSingle(application.id)}
                          className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white text-xs font-semibold rounded-lg hover:from-gray-700 hover:to-gray-600 shadow-soft transition-all duration-200"
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
        </div>
      )}
    </div>
  );
} 