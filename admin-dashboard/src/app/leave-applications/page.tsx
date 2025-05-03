'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApplicationService } from '@/services/leaveApplicationService';
import toast from 'react-hot-toast';

interface LeaveApplication {
  id: string;
  teacher_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function LeaveApplicationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userRole, setUserRole] = useState<string | null>(null);

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

  const { data: applications, isLoading } = useQuery<LeaveApplication[]>({
    queryKey: ['leaveApplications'],
    queryFn: leaveApplicationService.getLeaveApplications,
    enabled: userRole === 'admin'
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

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading leave applications...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leave Applications</h1>
      </div>

      <div className="grid gap-6">
        {applications?.map((application) => (
          <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{application.teacher_name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(application.start_date).toLocaleDateString()} - {new Date(application.end_date).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                application.status === 'approved' 
                  ? 'bg-green-100 text-green-800'
                  : application.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {application.status}
              </span>
            </div>
            <p className="mb-4">{application.reason}</p>
            <div className="flex gap-2">
              {application.status === 'pending' && (
                <>
                  <button
                    onClick={() => approveMutation.mutate(application.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(application.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 