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
import ParentListModal from '@/components/modals/ParentListModal';

export default function ParentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string} | null>(null);
  const [isParentListModalOpen, setIsParentListModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<ParentFormData>();

  const password = watch('password');

  // Handle adding a new parent - clear all form fields
  const handleAddParent = () => {
    setIsModalOpen(true);
    setEditingParent(null);
    setCreatedCredentials(null);
    reset({
      name: '',
      email: '',
      phone_number: '',
      password: '',
      password_confirmation: ''
    });
  };

  useEffect(() => {
    if (editingParent) {
      reset({
        name: editingParent.name,
        email: editingParent.email,
        phone_number: editingParent.phone_number,
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
    mutationFn: (data) => parentService.createParent(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      // Set credentials to display in modal
      setCreatedCredentials({
        email: variables.email,
        password: variables.password
      });
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

  // Handle viewing a specific parent
  const handleViewParent = (parent: Parent) => {
    setSelectedParent(parent);
    setIsParentListModalOpen(true);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-soft">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-1">Parents</h1>
            <p className="text-gray-600 font-medium">Manage your school&apos;s parent community</p>
          </div>
        </div>
        <button
          onClick={handleAddParent}
          disabled={createMutation.isPending || updateMutation.isPending}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-soft hover:shadow-medium disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5" />
          Add Parent
        </button>
      </div>

      {/* Search bar and Show All button */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm shadow-sm"
            placeholder="Search parents by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!isListVisible && !searchQuery && (
          <button
            onClick={() => setIsListVisible(true)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
          >
            Show All Parents
          </button>
        )}
        {isListVisible && !searchQuery && (
          <button
            onClick={() => setIsListVisible(false)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
          >
            Hide All
          </button>
        )}
        {shouldDisplayParents && !showAll && filteredParents.length > 5 && (
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
          >
            Show More ({filteredParents.length})
          </button>
        )}
        {shouldDisplayParents && showAll && filteredParents.length > 5 && (
          <button
            onClick={() => setShowAll(false)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
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
        <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50">
          <div className="p-4 bg-blue-50 rounded-xl inline-block mb-4">
            <UserGroupIcon className="mx-auto h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Search or show all parents</h3>
          <p className="text-gray-600">Use the search bar above to find specific parents or click &quot;Show All Parents&quot; to view all parents.</p>
        </div>
      ) : !displayedParents.length ? (
        <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50">
          {searchQuery ? (
            <>
              <div className="p-4 bg-red-50 rounded-xl inline-block mb-4">
                <XMarkIcon className="mx-auto h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search or filter to find what you&rsquo;re looking for.</p>
            </>
          ) : (
            <>
              <div className="p-4 bg-blue-50 rounded-xl inline-block mb-4">
                <UserGroupIcon className="mx-auto h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">No parents</h3>
              <p className="text-gray-600">Get started by adding a new parent.</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden sm:block bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-blue-100">
                  {displayedParents.map((parent: Parent) => (
                    <tr 
                      key={parent.id} 
                      className="hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                      onClick={(e) => {
                        // Prevent click when clicking action buttons
                        if ((e.target as HTMLElement).closest('button')) return;
                        handleViewParent(parent);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{parent.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{parent.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{parent.phone_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(parent);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-4 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(parent.id);
                          }}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
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
          <div className="grid grid-cols-1 gap-6 sm:hidden">
            {displayedParents.map((parent: Parent) => (
              <div 
                key={parent.id} 
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50 p-6 cursor-pointer hover:shadow-medium transition-all duration-300"
                onClick={(e) => {
                  // Prevent click when clicking action buttons
                  if ((e.target as HTMLElement).closest('button')) return;
                  handleViewParent(parent);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                      <UserGroupIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{parent.name}</h3>
                      <p className="text-sm text-gray-600">{parent.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(parent);
                      }}
                      className="p-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(parent.id);
                      }}
                      className="p-2 rounded-xl text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-200"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium text-blue-700">Phone:</span>
                    <span className="ml-2 px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200">
                      {parent.phone_number}
                    </span>
                  </div>
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
          setCreatedCredentials(null);
          reset();
        }}
        className="relative z-50"
      >
        {/* Background blur - visible only on non-mobile */}
        <div className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm hidden sm:block" aria-hidden="true" />
        
        {/* Modal container - full screen on mobile */}
        <div className="fixed inset-0 flex items-center justify-center sm:p-4">
          <Dialog.Panel className="relative transform overflow-hidden bg-white sm:rounded-2xl px-4 sm:px-8 py-6 sm:py-8 shadow-xl transition-all w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[95vh] overflow-y-auto">
            <div className="absolute right-3 top-3 sm:right-6 sm:top-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingParent(null);
                  setCreatedCredentials(null);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
              <div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-2 sm:p-3 border border-blue-200">
                <UserGroupIcon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
              </div>
              <Dialog.Title className="text-xl sm:text-2xl font-bold leading-6 text-blue-900">
                {editingParent ? 'Edit Parent Information' : 'Add New Parent'}
              </Dialog.Title>
            </div>

            {/* Credentials display after successful parent creation */}
            {createdCredentials && (
              <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-soft">
                <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Parent created successfully!
                </h3>
                <p className="text-sm text-green-700 mb-4">Please share these login credentials with the parent:</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-green-300 shadow-soft">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700">Username/Email:</span>
                      <code className="ml-3 font-mono text-green-900 bg-green-100 px-2 py-1 rounded">{createdCredentials.email}</code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.email);
                        toast.success('Email copied to clipboard');
                      }}
                      className="ml-3 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors duration-200"
                    >
                      Copy
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-green-300 shadow-soft">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700">Password:</span>
                      <code className="ml-3 font-mono text-green-900 bg-green-100 px-2 py-1 rounded">{createdCredentials.password}</code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.password);
                        toast.success('Password copied to clipboard');
                      }}
                      className="ml-3 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors duration-200"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setCreatedCredentials(null);
                      reset();
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-soft"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {!createdCredentials && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8" autoComplete="off">
                <div className="grid grid-cols-1 gap-x-6 sm:gap-x-8 gap-y-6 sm:gap-y-8 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Full Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        autoComplete="off"
                        {...register('name', { 
                          required: 'Name is required',
                          minLength: { value: 2, message: 'Name must be at least 2 characters' }
                        })}
                        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                        placeholder="Enter parent's full name"
                      />
                      {errors.name && (
                        <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Email Address
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        type="email"
                        autoComplete="off"
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Please enter a valid email address'
                          }
                        })}
                        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                        placeholder="Enter email address"
                      />
                      {errors.email && (
                        <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Phone Number
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="mt-2 relative">
                      <input
                        type="tel"
                        autoComplete="off"
                        {...register('phone_number', { 
                          required: 'Phone number is required',
                          pattern: {
                            value: /^07[0-9]{8}$/,
                            message: 'Please enter a valid phone number (format: 07XXXXXXXX)'
                          }
                        })}
                        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                        placeholder="Enter phone number"
                      />
                      <div className="absolute right-3 top-3 group">
                        <QuestionMarkCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        <div className="hidden group-hover:block absolute right-0 top-6 bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                          Enter a valid phone number (format: 07XXXXXXXX)
                        </div>
                      </div>
                      {errors.phone_number && (
                        <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.phone_number.message}</p>
                      )}
                    </div>
                  </div>

                {/* Password fields - only show when creating new parent */}
                {!editingParent && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="mt-2">
                        <input
                          type="password"
                          autoComplete="new-password"
                          {...register('password', { 
                            required: !editingParent ? 'Password is required' : false,
                            minLength: { value: 6, message: 'Password must be at least 6 characters' }
                          })}
                          className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                          placeholder="Enter password"
                        />
                        {errors.password && (
                          <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.password.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Confirm Password
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="mt-2">
                        <input
                          type="password"
                          autoComplete="new-password"
                          {...register('password_confirmation', { 
                            required: !editingParent ? 'Please confirm your password' : false,
                            validate: value => !editingParent ? (value === password || 'Passwords do not match') : true
                          })}
                          className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                          placeholder="Confirm password"
                        />
                        {errors.password_confirmation && (
                          <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.password_confirmation.message}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingParent(null);
                      setCreatedCredentials(null);
                      reset();
                    }}
                    className="rounded-xl px-6 py-3 text-sm font-semibold text-blue-700 shadow-soft ring-1 ring-inset ring-blue-200 hover:bg-blue-50 disabled:opacity-50 w-full sm:w-auto order-2 sm:order-1 bg-blue-50/50 backdrop-blur-sm transition-all duration-200"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-soft hover:from-blue-700 hover:to-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2 backdrop-blur-sm transition-all duration-200"
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
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Parent Detail Modal */}
      {selectedParent && (
        <ParentListModal
          isOpen={isParentListModalOpen}
          onClose={() => {
            setIsParentListModalOpen(false);
            setSelectedParent(null);
          }}
          parents={[selectedParent]}
          readOnly={true}
        />
      )}
    </div>
  );
} 