'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superuserService, type School } from '@/services/superuserService';
import { useAuth } from '@/hooks/useAuth';
import {
  BuildingLibraryIcon,
  UsersIcon,
  AcademicCapIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

export default function SuperuserPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);

  // Redirect if not superuser
  if (user && user.role !== 'superuser') {
    router.push('/dashboard');
    return null;
  }

  // Fetch superuser dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['superuser-stats'],
    queryFn: superuserService.getDashboardStats,
    staleTime: 60000, // 1 minute
  });

  // Fetch schools
  const { data: schools = [], isLoading: isLoadingSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: superuserService.getSchools,
    staleTime: 60000, // 1 minute
  });

  // School form
  const {
    register: registerSchool,
    handleSubmit: handleSchoolSubmit,
    formState: { errors: schoolErrors },
    reset: resetSchoolForm,
  } = useForm<Partial<School>>();

  // Admin form
  const {
    register: registerAdmin,
    handleSubmit: handleAdminSubmit,
    formState: { errors: adminErrors },
    reset: resetAdminForm,
  } = useForm();

  // Create school mutation
  const createSchoolMutation = useMutation({
    mutationFn: superuserService.createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['superuser-stats'] });
      setIsCreateModalOpen(false);
      resetSchoolForm();
      toast.success('School created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating school:', error);
      toast.error(error.message || 'Failed to create school');
    },
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: (data: any) => {
      if (!currentSchool) throw new Error('No school selected');
      return superuserService.createAdminForSchool(currentSchool.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setIsAdminModalOpen(false);
      resetAdminForm();
      toast.success('Admin created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create admin');
    },
  });

  // Delete school mutation
  const deleteSchoolMutation = useMutation({
    mutationFn: superuserService.deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['superuser-stats'] });
      toast.success('School deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting school:', error);
      toast.error(error.message || 'Failed to delete school');
    },
  });

  const onCreateSchool = (data: Partial<School>) => {
    createSchoolMutation.mutate(data);
  };

  const onCreateAdmin = (data: any) => {
    createAdminMutation.mutate(data);
  };

  const confirmDeleteSchool = (school: School) => {
    if (window.confirm(`Are you sure you want to delete ${school.name}?`)) {
      deleteSchoolMutation.mutate(school.id);
    }
  };

  const openAdminModal = (school: School) => {
    setCurrentSchool(school);
    setIsAdminModalOpen(true);
  };

  const isLoading = isLoadingStats || isLoadingSchools;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Schools',
      value: stats?.school_count || 0,
      icon: BuildingLibraryIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Users',
      value: stats?.users_count || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Teachers',
      value: stats?.teachers_count || 0,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Students',
      value: stats?.students_count || 0,
      icon: UserGroupIcon,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Superuser Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Manage all schools and users</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((item) => (
            <div
              key={item.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <item.icon
                      className={`h-6 w-6 ${item.color} text-white rounded p-1`}
                    />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {item.value}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Schools Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Schools</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
              Add School
            </button>
          </div>

          {schools.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <BuildingLibraryIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No schools</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new school.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schools.map((school) => (
                    <tr key={school.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{school.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{school.registration_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{school.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {school.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openAdminModal(school)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Add Admin
                        </button>
                        <button
                          onClick={() => confirmDeleteSchool(school)}
                          className="text-red-600 hover:text-red-900 ml-4"
                          disabled={deleteSchoolMutation.isPending}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create School Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetSchoolForm();
        }}
      >
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Create New School
              </Dialog.Title>
            </div>

            <form onSubmit={handleSchoolSubmit(onCreateSchool)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    School Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...registerSchool('name', { required: 'School name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {schoolErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{schoolErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700">
                    Registration Number
                  </label>
                  <input
                    id="registration_number"
                    type="text"
                    {...registerSchool('registration_number', { required: 'Registration number is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {schoolErrors.registration_number && (
                    <p className="mt-1 text-sm text-red-600">{schoolErrors.registration_number.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...registerSchool('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Invalid email address',
                      },
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {schoolErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{schoolErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    type="text"
                    {...registerSchool('phone_number', { required: 'Phone number is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {schoolErrors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{schoolErrors.phone_number.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    {...registerSchool('address', { required: 'Address is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {schoolErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{schoolErrors.address.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetSchoolForm();
                  }}
                  className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSchoolMutation.isPending}
                  className="rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {createSchoolMutation.isPending ? 'Creating...' : 'Create School'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Create Admin Modal */}
      <Dialog
        open={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          resetAdminForm();
        }}
      >
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                Add Admin for {currentSchool?.name}
              </Dialog.Title>
            </div>

            <form onSubmit={handleAdminSubmit(onCreateAdmin)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    {...registerAdmin('first_name', { required: 'First name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {adminErrors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{adminErrors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    {...registerAdmin('last_name', { required: 'Last name is required' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {adminErrors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{adminErrors.last_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="admin_email"
                    type="email"
                    {...registerAdmin('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Invalid email address',
                      },
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {adminErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{adminErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    {...registerAdmin('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  {adminErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{adminErrors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    resetAdminForm();
                  }}
                  className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAdminMutation.isPending}
                  className="rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 