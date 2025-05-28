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
import { studentService, type Student } from '@/services/studentService';
import { Dialog } from '@/components/ui/dialog';
import { parentService, type Parent } from '@/services/parentService';

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

interface StudentFormData {
  name: string;
  contact: string;
  grade: number;
  class_assigned?: string;
  parent_email: string;
}

export default function StudentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isListVisible, setIsListVisible] = useState(false);
  const queryClient = useQueryClient();
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [parentSearchResults, setParentSearchResults] = useState<Parent[]>([]);
  const [showParentSearch, setShowParentSearch] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<StudentFormData>({
    defaultValues: editingStudent ? {
      name: editingStudent.name,
      contact: editingStudent.contact,
      grade: editingStudent.grade,
      class_assigned: editingStudent.class_assigned || undefined,
      parent_email: ''
    } : {}
  });

  const {
    data: studentsResponse,
    isLoading: isLoadingStudents,
    error: studentsError,
    isError: isStudentsError
  } = useQuery({
    queryKey: ['students'],
    queryFn: studentService.getStudents,
    retry: 1,
    staleTime: 30000,
  });

  const { data: parentsData } = useQuery({
    queryKey: ['parents'],
    queryFn: parentService.getParents,
    enabled: showParentSearch
  });

  // Extract students array from the response
  const students = studentsResponse?.results || [];

  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.contact.toLowerCase().includes(query) ||
      (student.class_assigned && student.class_assigned.toLowerCase().includes(query)) ||
      String(student.grade).includes(query)
    );
  });

  // Search for parents when typing
  useEffect(() => {
    if (parentSearchQuery && parentsData?.results) {
      const filtered = parentsData.results.filter(parent => 
        parent.name.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
        parent.email.toLowerCase().includes(parentSearchQuery.toLowerCase())
      );
      setParentSearchResults(filtered);
      setShowParentSearch(filtered.length > 0);
    } else {
      setParentSearchResults([]);
      setShowParentSearch(false);
    }
  }, [parentSearchQuery, parentsData]);

  const handleParentSelect = (parent: Parent) => {
    setValue('parent_email', parent.email);
    setParentSearchQuery(parent.name);
    setShowParentSearch(false);
  };

  // Only display students if search is active or list visibility is toggled
  const shouldDisplayStudents = isListVisible || searchQuery.length > 0;
  
  // Limit displayed students unless "Show All" is clicked
  const displayedStudents = shouldDisplayStudents ? 
    (showAll ? filteredStudents : filteredStudents.slice(0, 5)) : 
    [];

  const createMutation = useMutation<Student, Error, StudentFormData>({
    mutationFn: studentService.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsModalOpen(false);
      reset();
      toast.success('Student created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create student');
    }
  });

  const updateMutation = useMutation<Student, Error, { id: string } & StudentFormData>({
    mutationFn: ({ id, ...data }) => studentService.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsModalOpen(false);
      setEditingStudent(null);
      reset();
      toast.success('Student updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update student');
    }
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: studentService.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete student');
    }
  });

  const onSubmit: SubmitHandler<StudentFormData> = (data) => {
    if (editingStudent) {
      updateMutation.mutate({ ...data, id: editingStudent.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    reset({
      name: student.name,
      contact: student.contact,
      grade: student.grade,
      class_assigned: student.class_assigned || undefined,
      parent_email: ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    reset({
      name: '',
      contact: '',
      grade: undefined,
      class_assigned: '',
      parent_email: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">Students</h1>
        </div>
        <button
          onClick={handleAddStudent}
          disabled={createMutation.isPending || updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <PlusIcon className="h-5 w-5" />
          Add Student
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
            placeholder="Search students..."
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
        {shouldDisplayStudents && !showAll && filteredStudents.length > 5 && (
          <button
            onClick={() => setShowAll(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Show More ({filteredStudents.length})
          </button>
        )}
        {shouldDisplayStudents && showAll && filteredStudents.length > 5 && (
          <button
            onClick={() => setShowAll(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Show Less
          </button>
        )}
      </div>

      {isLoadingStudents ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-sm text-gray-600">Loading students...</span>
        </div>
      ) : isStudentsError ? (
        <div className="text-center py-12">
          <XMarkIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load students</h3>
          <p className="mt-1 text-sm text-gray-500">
            {studentsError instanceof Error ? studentsError.message : 'Please try refreshing the page.'}
          </p>
        </div>
      ) : !shouldDisplayStudents ? (
        <div className="text-center p-12 bg-white rounded-lg shadow">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Search or show all students</h3>
          <p className="mt-1 text-sm text-gray-500">Use the search bar above to find specific students or click &quot;Show All&quot; to view all students.</p>
        </div>
      ) : displayedStudents.length === 0 ? (
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new student.</p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {displayedStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.grade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.class_assigned || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.parent ? `${student.parent.name} (${student.parent.email})` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
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
            {displayedStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-medium text-gray-900">{student.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Contact:</span> {student.contact}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium text-gray-700">Grade:</span> {student.grade}
                  </p>
                  {student.class_assigned && (
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">Class:</span> {student.class_assigned}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Student Form Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
          reset({
            name: '',
            contact: '',
            grade: undefined,
            class_assigned: '',
            parent_email: ''
          });
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
                  setEditingStudent(null);
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
                {editingStudent ? 'Edit Student Information' : 'Add New Student'}
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
                      placeholder="Enter student's full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Number
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-1.5 sm:mt-2 relative">
                    <input
                      type="tel"
                      {...register('contact', { 
                        required: 'Contact number is required',
                        pattern: {
                          value: /^07[0-9]{8}$/,
                          message: 'Please enter a valid phone number (format: 07XXXXXXXX)'
                        }
                      })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                      placeholder="Enter contact number"
                    />
                    <div className="absolute right-2 top-1.5 group">
                      <QuestionMarkCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <div className="hidden group-hover:block absolute right-0 top-6 bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                        Enter a valid phone number (format: 07XXXXXXXX)
                      </div>
                    </div>
                    {errors.contact && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.contact.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="parent_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Parent *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for parent by name..."
                      value={parentSearchQuery}
                      onChange={(e) => {
                        setParentSearchQuery(e.target.value);
                        setShowParentSearch(true);
                      }}
                      onFocus={() => setIsListVisible(true)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="hidden"
                      {...register('parent_email', { required: 'Parent is required' })}
                    />
                    
                    {/* Parent search dropdown */}
                    {showParentSearch && parentSearchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                        {parentSearchResults.map((parent) => (
                          <div
                            key={parent.id}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50"
                            onClick={() => handleParentSelect(parent)}
                          >
                            <div className="flex items-center">
                              <span className="font-normal ml-3 block truncate">
                                {parent.name} ({parent.email})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.parent_email && (
                    <p className="text-red-600 text-sm mt-1">{errors.parent_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Grade
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-1.5 sm:mt-2">
                    <select
                      {...register('grade', { required: 'Grade is required' })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                    >
                      <option value="">Select grade</option>
                      {GRADES.map((grade) => (
                        <option key={grade} value={grade}>
                          Grade {grade}
                        </option>
                      ))}
                    </select>
                    {errors.grade && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.grade.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class
                  </label>
                  <div className="mt-1.5 sm:mt-2">
                    <input
                      type="text"
                      {...register('class_assigned')}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                      placeholder="Enter class (e.g., 7A)"
                    />
                    {errors.class_assigned && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.class_assigned.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingStudent(null);
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
                      {editingStudent ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <>{editingStudent ? 'Update Student' : 'Create Student'}</>
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