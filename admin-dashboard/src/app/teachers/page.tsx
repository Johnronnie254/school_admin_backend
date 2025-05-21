'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, UserGroupIcon, EnvelopeIcon, PhoneIcon, AcademicCapIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { teacherService } from '@/services/teacherService';
import { Dialog } from '@/components/ui/dialog';
import { AxiosError } from 'axios';

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
  'Science',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Physical Education',
  'Art',
  'Music'
];

export default function TeachersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
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

  const createMutation = useMutation({
    mutationFn: (data: TeacherFormData) => teacherService.createTeacher({ ...data, subjects: selectedSubjects }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      // Store the password for display
      if (variables.password) {
        setCreatedPassword(variables.password);
      }
      toast.success('Teacher created successfully');
      // Don't close modal immediately if we have a password to show
      if (!variables.password) {
        setIsModalOpen(false);
        reset();
        setSelectedSubjects([]);
      }
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
    reset({
      name: '',
      email: '',
      phone_number: '',
      class_assigned: '',
      password: '',
      password_confirmation: ''
    });
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Teachers</h1>
        </div>
        <button
          onClick={handleAddTeacher}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Teacher
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
            placeholder="Search teachers..."
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
        {shouldDisplayTeachers && !showAll && filteredTeachers.length > 5 && (
          <button
            onClick={() => setShowAll(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Show More ({filteredTeachers.length})
          </button>
        )}
        {shouldDisplayTeachers && showAll && filteredTeachers.length > 5 && (
          <button
            onClick={() => setShowAll(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
        <div className="text-center p-12 bg-white rounded-lg shadow">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Search or show all teachers</h3>
          <p className="mt-1 text-sm text-gray-500">Use the search bar above to find specific teachers or click &quot;Show All&quot; to view all teachers.</p>
        </div>
      ) : displayedTeachers.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg shadow">
          {searchQuery ? (
            <>
              <XMarkIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you&rsquo;re looking for.</p>
            </>
          ) : (
            <>
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new teacher.</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedTeachers.map((teacher: Teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.phone_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.class_assigned || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="text-red-600 hover:text-red-900"
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
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {displayedTeachers.map((teacher: Teacher) => (
              <div key={teacher.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900">{teacher.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(teacher)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    {teacher.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    {teacher.phone_number}
                  </div>
                  {teacher.class_assigned && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="w-4 h-4 mr-2" />
                      Class: {teacher.class_assigned}
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Subjects:</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
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
          setCreatedPassword(null);
          reset();
        }}
        className="relative z-50"
      >
        {/* Background blur - visible only on non-mobile */}
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm hidden sm:block" aria-hidden="true" />
        
        {/* Modal container - full screen on mobile */}
        <div className="fixed inset-0 flex items-center justify-center sm:p-4">
          <Dialog.Panel className="relative transform overflow-hidden bg-white sm:rounded-lg px-4 sm:px-6 py-6 sm:py-8 shadow-xl transition-all w-full h-full sm:h-auto sm:max-w-lg sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
            <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTeacher(null);
                  setCreatedPassword(null);
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
                {editingTeacher ? 'Edit Teacher Information' : 'Add New Teacher'}
              </Dialog.Title>
            </div>

            {/* Password display after successful teacher creation */}
            {createdPassword && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-sm font-medium text-green-800 mb-2">Teacher created successfully!</h3>
                <p className="text-sm text-green-700 mb-2">Please note down this temporary password. It will be shown only once:</p>
                <div className="flex items-center justify-between bg-white p-2 rounded border border-green-300">
                  <code className="text-sm font-mono text-green-900">{createdPassword}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdPassword);
                      toast.success('Password copied to clipboard');
                    }}
                    className="ml-2 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
                  >
                    Copy
                  </button>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setCreatedPassword(null);
                      reset();
                      setSelectedSubjects([]);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {!createdPassword && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6" autoComplete="off">
                <div className="grid grid-cols-1 gap-x-4 sm:gap-x-6 gap-y-5 sm:gap-y-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="mt-1.5 sm:mt-2">
                      <input
                        type="text"
                        autoComplete="off"
                        {...register('name', { required: 'Name is required' })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                        placeholder="Enter teacher's name"
                      />
                      {errors.name && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.name.message}</p>}
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
                        autoComplete="off"
                        {...register('email', { required: 'Email is required' })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                        placeholder="Enter email address"
                      />
                      {errors.email && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="mt-1.5 sm:mt-2">
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
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                      />
                      {errors.phone_number && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.phone_number.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Class Assigned
                    </label>
                    <div className="mt-1.5 sm:mt-2">
                      <input
                        autoComplete="off"
                        {...register('class_assigned')}
                        placeholder="e.g., Grade 7A"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                  
                  {/* Password fields - only show when creating new teacher */}
                  {!editingTeacher && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Password
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="mt-1.5 sm:mt-2">
                          <input
                            type="password"
                            autoComplete="new-password"
                            {...register('password', { 
                              required: !editingTeacher ? 'Password is required' : false,
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
                            autoComplete="new-password"
                            {...register('password_confirmation', { 
                              required: !editingTeacher ? 'Please confirm your password' : false,
                              validate: value => !editingTeacher ? (value === password || 'Passwords do not match') : true
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Subjects
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
                    {AVAILABLE_SUBJECTS.map((subject) => (
                      <div key={subject} className="flex items-center">
                        <input
                          type="checkbox"
                          id={subject}
                          checked={selectedSubjects.includes(subject)}
                          onChange={() => toggleSubject(subject)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={subject} className="ml-2 text-xs sm:text-sm text-gray-700 truncate">
                          {subject}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedSubjects.length === 0 && (
                    <p className="mt-1.5 text-xs sm:text-sm text-red-600">Please select at least one subject</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingTeacher(null);
                      setSelectedSubjects([]);
                      reset();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedSubjects.length === 0 || createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
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
    </div>
  );
} 