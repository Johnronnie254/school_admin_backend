'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  XMarkIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';
import { parentService, type Parent, type ParentFormData } from '@/services/parentService';

export default function ParentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ParentFormData>({
    defaultValues: editingParent ? {
      name: editingParent.name,
      email: editingParent.email,
      phone_number: editingParent.phone_number,
    } : {}
  });

  const { data: parents = [], isLoading } = useQuery<Parent[]>({
    queryKey: ['parents'],
    queryFn: parentService.getParents
  });

  const createMutation = useMutation<Parent, Error, ParentFormData>({
    mutationFn: parentService.createParent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      setIsModalOpen(false);
      reset();
      toast.success('Parent created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create parent');
    }
  });

  const updateMutation = useMutation<Parent, Error, { id: string } & ParentFormData>({
    mutationFn: ({ id, ...data }) => parentService.updateParent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      setIsModalOpen(false);
      setEditingParent(null);
      reset();
      toast.success('Parent updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update parent');
    }
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: parentService.deleteParent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      toast.success('Parent deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete parent');
    }
  });

  const onSubmit: SubmitHandler<ParentFormData> = (data) => {
    if (editingParent) {
      updateMutation.mutate({ ...data, id: editingParent.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent);
    reset({
      name: parent.name,
      email: parent.email,
      phone_number: parent.phone_number,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">Parents</h1>
        </div>
        <button
          onClick={() => {
            setEditingParent(null);
            setIsModalOpen(true);
          }}
          disabled={createMutation.isPending || updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <PlusIcon className="h-5 w-5" />
          Add Parent
        </button>
      </div>

      {isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : parents.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No parents</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new parent.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parents.map((parent: Parent) => (
                <tr key={parent.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{parent.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{parent.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{parent.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(parent)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(parent.id)}
                      className="text-red-600 hover:text-red-900"
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

      {/* Parent Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl w-full max-w-2xl shadow-2xl relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingParent(null);
                reset();
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {editingParent ? 'Edit Parent Information' : 'Add New Parent'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name', { 
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter parent's full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      {...register('phone_number', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^07[0-9]{8}$/,
                          message: 'Please enter a valid phone number (format: 07XXXXXXXX)'
                        }
                      })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                    <div className="absolute right-2 top-2 group">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
                      <div className="hidden group-hover:block absolute right-0 top-6 bg-gray-800 text-white text-xs rounded p-2 w-48">
                        Enter a valid phone number (format: 07XXXXXXXX)
                      </div>
                    </div>
                  </div>
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                  )}
                </div>

                {!editingParent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="password"
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingParent(null);
                    reset();
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingParent ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{editingParent ? 'Update Parent' : 'Create Parent'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 