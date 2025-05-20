'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  XMarkIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { parentService, type Parent, type ParentFormData } from '@/services/parentService';
import { Dialog } from '@/components/ui/dialog';
import type { PaginatedResponse } from '@/types';

export default function ParentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<ParentFormData>();

  const password = watch('password');

  useEffect(() => {
    if (editingParent) {
      reset({
        name: editingParent.name,
        email: editingParent.email,
        phone_number: editingParent.phone_number,
      });
    } else {
      reset({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        password_confirmation: '',
      });
    }
  }, [editingParent, reset]);

  const { data: parentsData, isLoading } = useQuery<PaginatedResponse<Parent>>({
    queryKey: ['parents'],
    queryFn: async () => {
      const response = await parentService.getParents();
      console.log('Parents API Response:', response);
      return response;
    }
  });

  // Filter parents based on search query
  const filteredParents = parentsData?.results?.filter(parent => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      parent.name.toLowerCase().includes(query) ||
      parent.email.toLowerCase().includes(query) ||
      (parent.phone_number && parent.phone_number.toLowerCase().includes(query))
    );
  }) || [];

  // Only display parents if search is active or list visibility is toggled
  const shouldDisplayParents = isListVisible || searchQuery.length > 0;
  
  // Limit displayed parents unless "Show All" is clicked
  const displayedParents = shouldDisplayParents ? 
    (showAll ? filteredParents : filteredParents.slice(0, 5)) : 
    [];

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
            reset();
            setIsModalOpen(true);
          }}
          disabled={createMutation.isPending || updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <PlusIcon className="h-5 w-5" />
          Add Parent
        </button>
      </div>

      {/* Search bar and Show All button */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search parents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!isListVisible && !searchQuery && (
          <button
            onClick={() => setIsListVisible(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Show All
          </button>
        )}
        {isListVisible && !searchQuery && (
          <button
            onClick={() => setIsListVisible(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Hide All
          </button>
        )}
        {shouldDisplayParents && !showAll && filteredParents.length > 5 && (
          <button
            onClick={() => setShowAll(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Show More ({filteredParents.length})
          </button>
        )}
        {shouldDisplayParents && showAll && filteredParents.length > 5 && (
          <button
            onClick={() => setShowAll(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Show Less
          </button>
        )}
      </div>

      {isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !shouldDisplayParents ? (
        <div className="text-center p-12 bg-white rounded-lg shadow">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Search or show all parents</h3>
          <p className="mt-1 text-sm text-gray-500">Use the search bar above to find specific parents or click &quot;Show All&quot; to view all parents.</p>
        </div>
      ) : !displayedParents.length ? (
        <div className="text-center py-12">
          {searchQuery ? (
            <>
              <XMarkIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you&rsquo;re looking for.</p>
            </>
          ) : (
            <>
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No parents</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new parent.</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
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
                  {displayedParents.map((parent: Parent) => (
                    <tr key={parent.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parent.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parent.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parent.phone_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
          </div>
          
          {/* Mobile Cards - Shown only on mobile */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {displayedParents.map((parent: Parent) => (
              <div key={parent.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-medium text-gray-900">{parent.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(parent)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(parent.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Email:</span> {parent.email}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Phone:</span> {parent.phone_number}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Parent Form Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingParent(null);
          reset();
        }}
        className="relative z-50"
      >
        {/* Background blur - visible only on non-mobile */}
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm hidden sm:block" aria-hidden="true" />
        
        {/* Modal container - full screen on mobile */}
        <div className="fixed inset-0 flex items-center justify-center sm:p-4">
          <Dialog.Panel className="relative transform overflow-hidden bg-white sm:rounded-lg px-4 sm:px-6 py-6 sm:py-8 shadow-xl transition-all w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
            <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingParent(null);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <div className="rounded-full bg-blue-50 p-1.5 sm:p-2">
                <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <Dialog.Title className="text-base sm:text-lg font-semibold leading-6 text-gray-900">
                {editingParent ? 'Edit Parent Information' : 'Add New Parent'}
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 gap-x-4 sm:gap-x-6 gap-y-5 sm:gap-y-8 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-1.5 sm:mt-2">
                    <input
                      type="text"
                      {...register('name', { 
                        required: 'Name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                      placeholder="Enter parent's full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-1.5 sm:mt-2">
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address'
                        }
                      })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-1.5 sm:mt-2 relative">
                    <input
                      type="tel"
                      {...register('phone_number', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^07[0-9]{8}$/,
                          message: 'Please enter a valid phone number (format: 07XXXXXXXX)'
                        }
                      })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                      placeholder="Enter phone number"
                    />
                    <div className="absolute right-2 top-1.5 group">
                      <QuestionMarkCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <div className="hidden group-hover:block absolute right-0 top-6 bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                        Enter a valid phone number (format: 07XXXXXXXX)
                      </div>
                    </div>
                    {errors.phone_number && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.phone_number.message}</p>
                    )}
                  </div>
                </div>

                {/* Password fields - only show when creating new parent */}
                {!editingParent && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="mt-1.5 sm:mt-2">
                        <input
                          type="password"
                          {...register('password', { 
                            required: !editingParent ? 'Password is required' : false,
                            minLength: { value: 6, message: 'Password must be at least 6 characters' }
                          })}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                          placeholder="Enter password"
                        />
                        {errors.password && (
                          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.password.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Confirm Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="mt-1.5 sm:mt-2">
                        <input
                          type="password"
                          {...register('password_confirmation', { 
                            required: !editingParent ? 'Please confirm your password' : false,
                            validate: value => !editingParent ? (value === password || 'Passwords do not match') : true
                          })}
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                          placeholder="Confirm password"
                        />
                        {errors.password_confirmation && (
                          <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.password_confirmation.message}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingParent(null);
                    reset();
                  }}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 w-full sm:w-auto order-2 sm:order-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingParent ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <>{editingParent ? 'Update Parent' : 'Create Parent'}</>
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