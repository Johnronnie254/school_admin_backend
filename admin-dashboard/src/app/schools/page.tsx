'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { schoolService } from '@/services/schoolService';

interface School {
  id: number;
  name: string;
  registration_number: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  is_active: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface SchoolFormData {
  name: string;
  registration_number: string;
  email: string;
  phone: string;
  address: string;
  website: string;
}

export default function SchoolsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SchoolFormData>();

  const { data: schools, isLoading } = useQuery<PaginatedResponse<School>>({
    queryKey: ['schools'],
    queryFn: () => schoolService.getSchools(),
  });

  const createMutation = useMutation({
    mutationFn: (data: SchoolFormData) => schoolService.createSchool(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School created successfully');
      setIsFormOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error('Failed to create school');
      console.error('Error creating school:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SchoolFormData) => {
      if (!editingSchool) throw new Error('No school selected for editing');
      return schoolService.updateSchool(editingSchool.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School updated successfully');
      setIsFormOpen(false);
      setEditingSchool(null);
      reset();
    },
    onError: (error) => {
      toast.error('Failed to update school');
      console.error('Error updating school:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => schoolService.deleteSchool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete school');
      console.error('Error deleting school:', error);
    },
  });

  const onSubmit = (data: SchoolFormData) => {
    if (editingSchool) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setIsFormOpen(true);
    reset(school);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schools Management</h1>
        <button
          onClick={() => {
            setIsFormOpen(true);
            setEditingSchool(null);
            reset();
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add School
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingSchool ? 'Edit School' : 'Add New School'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">School Name</label>
              <input
                {...register('name', { required: 'School name is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Number</label>
              <input
                {...register('registration_number', { required: 'Registration number is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.registration_number && (
                <p className="text-red-500 text-sm mt-1">{errors.registration_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                {...register('phone', { required: 'Phone is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                {...register('address', { required: 'Address is required' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                {...register('website')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingSchool(null);
                  reset();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingSchool ? 'Update School' : 'Create School'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : schools?.results?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  No schools found
                </td>
              </tr>
            ) : (
              schools?.results?.map((school: School) => (
                <tr key={school.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{school.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{school.registration_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{school.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{school.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(school)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(school.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 