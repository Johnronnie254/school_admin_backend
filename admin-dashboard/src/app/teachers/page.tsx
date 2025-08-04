'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, UserGroupIcon, EnvelopeIcon, PhoneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { teacherService } from '@/services/teacherService';
import { Dialog } from '@/components/ui/dialog';
import { AxiosError } from 'axios';
import TeacherListModal from '@/components/modals/TeacherListModal';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  class_assigned: string | null;
  subjects: string[];
  profile_pic?: string;
  school: string;
}

interface TeacherFormData {
  name: string;
  email: string;
  phone_number: string;
  class_assigned: string;
  subjects: string[];
  password?: string;
  password_confirmation?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const AVAILABLE_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Science and Technology',
  'Social Studies',
  'Religious Education',
  'Agriculture',
  'Home Science',
  'Creative Arts',
  'Physical and Health Education',
  'Indigenous Languages',
  'Pre-Technical Studies',
  'Business Studies',
  'Life Skills Education',
  'Computer Science'
];

export default function TeachersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string} | null>(null);
  const [isTeacherListModalOpen, setIsTeacherListModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<TeacherFormData>();

  const password = watch('password');

  const { data: teachers, isLoading } = useQuery<PaginatedResponse<Teacher>>({
    queryKey: ['teachers'],
    queryFn: async (): Promise<PaginatedResponse<Teacher>> => {
      try {
        const response = await teacherService.getTeachers();
        return response as PaginatedResponse<Teacher>;
      } catch (error: unknown) {
        console.error('Error loading teachers:', error);
        if (error instanceof AxiosError && error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
        } else {
          toast.error('Failed to load teachers. Please try again.');
        }
        throw error;
      }
    }
  });

  // Filter teachers based on search query
  const filteredTeachers = teachers?.results.filter(teacher => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      teacher.name.toLowerCase().includes(query) ||
      teacher.email.toLowerCase().includes(query) ||
      teacher.phone_number.toLowerCase().includes(query) ||
      (teacher.class_assigned && teacher.class_assigned.toLowerCase().includes(query))
    );
  }) || [];

  // Only display teachers if search is active or list visibility is toggled
  const shouldDisplayTeachers = isListVisible || searchQuery.length > 0;
  
  // Limit displayed teachers unless "Show All" is clicked
  const displayedTeachers = shouldDisplayTeachers ? 
    (showAll ? filteredTeachers : filteredTeachers.slice(0, 5)) : 
    [];

  const createMutation = useMutation<Teacher, AxiosError | Error, TeacherFormData>({
    mutationFn: async (data) => {
      const modifiedData = {
        ...data,
        subjects: selectedSubjects
      };
      return await teacherService.createTeacher(modifiedData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      // Display the login credentials in the modal
      if (variables.password) {
        setCreatedCredentials({
          email: variables.email,
          password: variables.password
        });
      }
      toast.success('Teacher created successfully');
    },
    onError: (error: AxiosError | Error) => {
      console.error('Error creating teacher:', error);
      if (error instanceof AxiosError && error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const message = error instanceof AxiosError ? error.response?.data?.message : error.message;
        toast.error(message || 'Failed to create teacher');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TeacherFormData) => {
      if (!editingTeacher) throw new Error('No teacher selected for editing');
      return teacherService.updateTeacher(editingTeacher.id, { ...data, subjects: selectedSubjects });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher updated successfully');
      setIsModalOpen(false);
      setEditingTeacher(null);
      reset();
      setSelectedSubjects([]);
    },
    onError: (error: AxiosError | Error) => {
      console.error('Error updating teacher:', error);
      if (error instanceof AxiosError && error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const message = error instanceof AxiosError ? error.response?.data?.message : error.message;
        toast.error(message || 'Failed to update teacher');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherService.deleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher deleted successfully');
    },
    onError: (error: AxiosError | Error) => {
      console.error('Error deleting teacher:', error);
      if (error instanceof AxiosError && error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const message = error instanceof AxiosError ? error.response?.data?.message : error.message;
        toast.error(message || 'Failed to delete teacher');
      }
    },
  });

  const onSubmit = (data: TeacherFormData) => {
    if (editingTeacher) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
    setSelectedSubjects(teacher.subjects);
    reset({
      name: teacher.name,
      email: teacher.email,
      phone_number: teacher.phone_number,
      class_assigned: teacher.class_assigned || '',
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleAddTeacher = () => {
    // Clear all form data and selections
    setIsModalOpen(true);
    setEditingTeacher(null);
    setSelectedSubjects([]);
    setCreatedCredentials(null);
    reset({
      name: '',
      email: '',
      phone_number: '',
      class_assigned: '',
      password: '',
      password_confirmation: ''
    });
  };

  // Handle viewing a specific teacher
  const handleViewTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsTeacherListModalOpen(true);
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
            <h1 className="text-3xl font-bold text-blue-900 mb-1">Teachers</h1>
            <p className="text-gray-600 font-medium">Manage your school&apos;s teaching staff</p>
          </div>
        </div>
        <button
          onClick={handleAddTeacher}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-soft hover:shadow-medium"
        >
          <PlusIcon className="w-5 h-5" />
          Add Teacher
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
            placeholder="Search teachers by name, email, phone, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!isListVisible && !searchQuery && (
          <button
            onClick={() => setIsListVisible(true)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
          >
            Show All Teachers
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
        {shouldDisplayTeachers && !showAll && filteredTeachers.length > 5 && (
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
          >
            Show More ({filteredTeachers.length})
          </button>
        )}
        {shouldDisplayTeachers && showAll && filteredTeachers.length > 5 && (
          <button
            onClick={() => setShowAll(false)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
          >
            Show Less
          </button>
        )}
      </div>

      {/* Table for desktop, Cards for mobile */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !shouldDisplayTeachers ? (
        <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50">
          <div className="p-4 bg-blue-50 rounded-xl inline-block mb-4">
            <UserGroupIcon className="mx-auto h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Search or show all teachers</h3>
          <p className="text-gray-600">Use the search bar above to find specific teachers or click &quot;Show All Teachers&quot; to view all teachers.</p>
        </div>
      ) : displayedTeachers.length === 0 ? (
        <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50">
          {searchQuery ? (
            <>
              <div className="p-4 bg-red-50 rounded-xl inline-block mb-4">
                <XMarkIcon className="mx-auto h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search or filter to find what you&apos;re looking for.</p>
            </>
          ) : (
            <>
              <div className="p-4 bg-blue-50 rounded-xl inline-block mb-4">
                <UserGroupIcon className="mx-auto h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">No teachers</h3>
              <p className="text-gray-600">Get started by adding a new teacher.</p>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-blue-100">
                  {displayedTeachers.map((teacher: Teacher) => (
                    <tr 
                      key={teacher.id} 
                      className="hover:bg-blue-50/50 cursor-pointer transition-all duration-200"
                      onClick={(e) => {
                        // Prevent click when clicking action buttons
                        if ((e.target as HTMLElement).closest('button')) return;
                        handleViewTeacher(teacher);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacher.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacher.phone_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{teacher.class_assigned || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(teacher);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-4 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(teacher.id);
                          }}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                        >
                          <TrashIcon className="w-5 h-5" />
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
            {displayedTeachers.map((teacher: Teacher) => (
              <div 
                key={teacher.id} 
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50 p-6 cursor-pointer hover:shadow-medium transition-all duration-300"
                onClick={(e) => {
                  // Prevent click when clicking action buttons
                  if ((e.target as HTMLElement).closest('button')) return;
                  handleViewTeacher(teacher);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                      <UserGroupIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
                      <p className="text-sm text-gray-600">{teacher.class_assigned ? `Class ${teacher.class_assigned}` : 'No class assigned'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(teacher);
                      }}
                      className="p-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(teacher.id);
                      }}
                      className="p-2 rounded-xl text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-200"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="w-4 h-4 mr-3 text-blue-500" />
                    {teacher.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="w-4 h-4 mr-3 text-blue-500" />
                    {teacher.phone_number}
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-xs font-medium text-blue-700 mb-2">Subjects:</p>
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Teacher Form Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeacher(null);
          setCreatedCredentials(null);
          reset();
        }}
        className="relative z-50"
      >
        {/* Background blur - visible only on non-mobile */}
        <div className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm hidden sm:block" aria-hidden="true" />
        
        {/* Modal container - full screen on mobile */}
        <div className="fixed inset-0 flex items-center justify-center sm:p-4">
          <Dialog.Panel className="relative transform overflow-hidden bg-white sm:rounded-2xl px-4 sm:px-8 py-6 sm:py-8 shadow-xl transition-all w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[95vh] overflow-y-auto">
            <div className="absolute right-3 top-3 sm:right-6 sm:top-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTeacher(null);
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
                {editingTeacher ? 'Edit Teacher Information' : 'Add New Teacher'}
              </Dialog.Title>
            </div>

            {/* Credentials display after successful teacher creation */}
            {createdCredentials && (
              <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-soft">
                <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Teacher created successfully!
                </h3>
                <p className="text-sm text-green-700 mb-4">Please share these login credentials with the teacher:</p>
                
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
                      setSelectedSubjects([]);
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
                <div className="grid grid-cols-1 gap-x-6 sm:gap-x-8 gap-y-6 sm:gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                    <div className="mt-2">
                    <input
                      type="text"
                        autoComplete="off"
                      {...register('name', { required: 'Name is required' })}
                        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                        placeholder="Enter teacher's full name"
                    />
                      {errors.name && <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.name.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Email
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                    <div className="mt-2">
                    <input
                      type="email"
                        autoComplete="off"
                      {...register('email', { required: 'Email is required' })}
                        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                        placeholder="Enter email address"
                    />
                      {errors.email && <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Phone Number
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                    <div className="mt-2">
                    <input
                        autoComplete="off"
                      {...register('phone_number', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^07\d{8}$/,
                          message: "Phone number must be in format '07XXXXXXXX'"
                        }
                      })}
                      placeholder="07XXXXXXXX"
                        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                    />
                      {errors.phone_number && <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.phone_number.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Class Assigned
                  </label>
                    <div className="mt-2">
                    <input
                        autoComplete="off"
                      {...register('class_assigned')}
                      placeholder="e.g., Grade 7A"
                        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                    />
                    </div>
                  </div>
                  
                  {/* Password fields - only show when creating new teacher */}
                  {!editingTeacher && (
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
                              required: !editingTeacher ? 'Password is required' : false,
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
                        <div className="mt-1.5 sm:mt-2">
                          <input
                            type="password"
                            autoComplete="new-password"
                            {...register('password_confirmation', { 
                              required: !editingTeacher ? 'Please confirm your password' : false,
                              validate: value => !editingTeacher ? (value === password || 'Passwords do not match') : true
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

                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-3">
                  Subjects
                  <span className="text-red-500 ml-1">*</span>
                </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {AVAILABLE_SUBJECTS.map((subject) => (
                    <div key={subject} className="flex items-center p-2 rounded-lg hover:bg-blue-50/50 transition-colors duration-200">
                      <input
                        type="checkbox"
                        id={subject}
                        checked={selectedSubjects.includes(subject)}
                        onChange={() => toggleSubject(subject)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded transition-colors duration-200"
                      />
                        <label htmlFor={subject} className="ml-3 text-xs sm:text-sm text-gray-700 font-medium cursor-pointer">
                        {subject}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedSubjects.length === 0 && (
                    <p className="mt-3 text-xs sm:text-sm text-red-600 bg-red-50 p-2 rounded-lg">Please select at least one subject</p>
                )}
              </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-8 sm:mt-10">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTeacher(null);
                    setSelectedSubjects([]);
                    reset();
                  }}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl hover:bg-blue-50 transition-all duration-200 w-full sm:w-auto order-2 sm:order-1 shadow-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedSubjects.length === 0 || createMutation.isPending || updateMutation.isPending}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2 shadow-soft hover:shadow-medium transition-all duration-200"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin -ml-1 mr-3 h-4 w-4 text-white">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      {editingTeacher ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingTeacher ? 'Update Teacher' : 'Create Teacher'
                  )}
                </button>
              </div>
            </form>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <TeacherListModal
          isOpen={isTeacherListModalOpen}
          onClose={() => {
            setIsTeacherListModalOpen(false);
            setSelectedTeacher(null);
          }}
          teachers={[selectedTeacher]}
          readOnly={true}
        />
      )}
    </div>
  );
} 