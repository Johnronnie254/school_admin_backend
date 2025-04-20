'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface LeaveApplication {
  id: string;
  teacher: {
    id: string;
    name: string;
    email: string;
    subjects: string[];
    class_assigned: string;
  };
  leave_type: 'sick' | 'casual' | 'emergency';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface StatusUpdateData {
  id: string;
  status: 'approved' | 'rejected';
}

const leaveTypes = {
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  emergency: 'Emergency Leave'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

const statusIcons = {
  pending: ClockIcon,
  approved: CheckIcon,
  rejected: XMarkIcon
};

export default function LeaveApplicationsPage() {
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const queryClient = useQueryClient();

  // Fetch leave applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['leaveApplications'],
    queryFn: async () => {
      const response = await fetch('/api/leave-applications/');
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    }
  });

  // Update application status
  const updateStatusMutation = useMutation({
    mutationFn: async (data: StatusUpdateData) => {
      const response = await fetch(`/api/leave-applications/${data.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: data.status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveApplications'] });
      toast.success('Leave application status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleApprove = (id: string) => {
    if (window.confirm('Are you sure you want to approve this leave application?')) {
      updateStatusMutation.mutate({ id, status: 'approved' });
    }
  };

  const handleReject = (id: string) => {
    if (window.confirm('Are you sure you want to reject this leave application?')) {
      updateStatusMutation.mutate({ id, status: 'rejected' });
    }
  };

  const filteredApplications = applications.filter((app: LeaveApplication) => 
    viewMode === 'all' ? true : app.status === viewMode
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Leave Applications</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setViewMode(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === status
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredApplications.map((application: LeaveApplication) => {
          const StatusIcon = statusIcons[application.status];
          return (
            <div
              key={application.id}
              className="bg-white rounded-lg shadow p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <UserCircleIcon className="h-12 w-12 text-gray-400" />
                    <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                      application.status === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{application.teacher.name}</h3>
                    <p className="text-sm text-gray-500">{application.teacher.email}</p>
                    <p className="text-sm text-gray-500">
                      {application.teacher.class_assigned} • {application.teacher.subjects.join(', ')}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusColors[application.status]}`}>
                  <StatusIcon className="h-4 w-4" />
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <p className="text-sm font-medium text-gray-500">Leave Type</p>
                  <p className="mt-1 text-sm text-gray-900">{leaveTypes[application.leave_type]}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <div className="flex items-center gap-1 mt-1">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {formatDate(application.start_date)} - {formatDate(application.end_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Reason</p>
                <p className="mt-1 text-sm text-gray-900">{application.reason}</p>
              </div>

              {application.status === 'pending' && (
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => handleReject(application.id)}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(application.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {viewMode === 'pending'
                ? 'No pending leave applications to review.'
                : viewMode === 'all'
                ? 'No leave applications found.'
                : `No ${viewMode} leave applications.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 