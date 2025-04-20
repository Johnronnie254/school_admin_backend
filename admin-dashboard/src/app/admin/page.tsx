'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, schoolApi, type SchoolStats, type SchoolSettings } from '@/lib/api';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  UserGroupIcon,
  BanknotesIcon,
  UsersIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<SchoolSettings>();

  // Fetch school statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery<SchoolStats>({
    queryKey: ['school-stats'],
    queryFn: async () => {
      const response = await schoolApi.getStatistics('current');
      return response.data;
    },
  });

  // Clear exam results mutation
  const clearExamsMutation = useMutation({
    mutationFn: () => adminApi.clearExamResults(),
    onSuccess: () => {
      toast.success('Exam results cleared successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear exam results');
    },
  });

  // Clear fee records mutation
  const clearFeesMutation = useMutation({
    mutationFn: () => adminApi.clearFeeRecords(),
    onSuccess: () => {
      toast.success('Fee records cleared successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear fee records');
    },
  });

  // Update school settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: SchoolSettings) => adminApi.updateSchoolSettings(data),
    onSuccess: () => {
      toast.success('School settings updated successfully');
      setIsSettingsOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update school settings');
    },
  });

  // Handle settings form submission
  const onSubmitSettings = (data: SchoolSettings) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoadingStats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage school settings, view statistics, and perform administrative tasks.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <Cog6ToothIcon className="h-5 w-5 inline-block mr-2" />
            Update Settings
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Teachers</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.total_teachers || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.total_students || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Parents</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.total_parents || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.active_users || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Administrative Actions</h3>
          <div className="mt-5">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all exam results? This action cannot be undone.')) {
                    clearExamsMutation.mutate();
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Clear All Exam Results
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all fee records? This action cannot be undone.')) {
                    clearFeesMutation.mutate();
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Clear All Fee Records
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <form onSubmit={handleSubmit(onSubmitSettings)} className="space-y-4">
                  <div>
                    <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700">
                      Academic Year
                    </label>
                    <input
                      type="number"
                      {...register('academic_year', { required: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="term" className="block text-sm font-medium text-gray-700">
                      Term
                    </label>
                    <select
                      {...register('term', { required: true })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="1">Term 1</option>
                      <option value="2">Term 2</option>
                      <option value="3">Term 3</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="fee_structure" className="block text-sm font-medium text-gray-700">
                      Fee Structure (JSON)
                    </label>
                    <textarea
                      {...register('fee_structure', { required: true })}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder='{"grade_1": 10000, "grade_2": 12000}'
                    />
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    >
                      {updateSettingsMutation.isPending ? 'Updating...' : 'Update Settings'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 