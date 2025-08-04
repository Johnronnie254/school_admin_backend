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
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { studentService, type Student } from '@/services/studentService';
import { Dialog } from '@/components/ui/dialog';
import { parentService, type Parent } from '@/services/parentService';

const GRADES = ['Playgroup', 'PP1', 'PP2', ...Array.from({ length: 12 }, (_, i) => i + 1)];

interface StudentFormData {
  name: string;
  grade: number;
  class_assigned?: string;
  parent_email: string;
  contact?: string;
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
      grade: editingStudent.grade,
      class_assigned: editingStudent.class_assigned || undefined,
      parent_email: '',
      contact: ''
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
    // Create a new object without the contact field if it's empty
    const studentData = {
      name: data.name,
      grade: data.grade,
      class_assigned: data.class_assigned,
      parent_email: data.parent_email,
      ...(data.contact ? { contact: data.contact } : {})  // Only include contact if it has a value
    };
    
    if (editingStudent) {
      updateMutation.mutate({ ...studentData, id: editingStudent.id });
    } else {
      createMutation.mutate(studentData);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    reset({
      name: student.name,
      grade: student.grade,
      class_assigned: student.class_assigned || undefined,
      parent_email: '',
      contact: ''
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
      grade: undefined,
      class_assigned: '',
      parent_email: '',
      contact: ''
    });
    setIsModalOpen(true);
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
            <h1 className="text-3xl font-bold text-blue-900 mb-1">Students</h1>
            <p className="text-gray-600 font-medium">Manage your school&apos;s student enrollment</p>
          </div>
        </div>
        <button
          onClick={handleAddStudent}
          disabled={createMutation.isPending || updateMutation.isPending}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-soft hover:shadow-medium disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5" />
          Add Student
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
            placeholder="Search students by name, grade, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!isListVisible && !searchQuery && (
          <button
            onClick={() => setIsListVisible(true)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
          >
            Show All Students
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
        {shouldDisplayStudents && !showAll && filteredStudents.length > 5 && (
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
          >
            Show More ({filteredStudents.length})
          </button>
        )}
        {shouldDisplayStudents && showAll && filteredStudents.length > 5 && (
          <button
            onClick={() => setShowAll(false)}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
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
        <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50">
          <div className="p-4 bg-blue-50 rounded-xl inline-block mb-4">
            <UserGroupIcon className="mx-auto h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Search or show all students</h3>
          <p className="text-gray-600">Use the search bar above to find specific students or click &quot;Show All Students&quot; to view all students.</p>
        </div>
      ) : displayedStudents.length === 0 ? (
        <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50">
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
              <h3 className="text-lg font-semibold text-blue-900 mb-2">No students</h3>
              <p className="text-gray-600">Get started by adding a new student.</p>
            </>
          )}
        </div>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-blue-100">
                  {displayedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50/50 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.grade}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.class_assigned || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-blue-600 hover:text-blue-800 mr-4 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
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
            {displayedStudents.map((student) => (
              <div key={student.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft border border-blue-200/50 p-6 hover:shadow-medium transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                      <UserGroupIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">Grade {student.grade}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(student)}
                      className="p-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="p-2 rounded-xl text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-200"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {student.class_assigned && (
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium text-blue-700">Class:</span>
                      <span className="ml-2 px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200">
                        {student.class_assigned}
                      </span>
                    </div>
                  </div>
                )}
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
                  setEditingStudent(null);
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
                {editingStudent ? 'Edit Student Information' : 'Add New Student'}
              </Dialog.Title>
            </div>

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
                      placeholder="Enter student's full name"
                    />
                    {errors.name && (
                      <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                {!editingStudent && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Parent
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="mt-2 relative">
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder="Search for parent by name..."
                        value={parentSearchQuery}
                        onChange={(e) => {
                          setParentSearchQuery(e.target.value);
                          setShowParentSearch(true);
                        }}
                        onFocus={() => setIsListVisible(true)}
                        className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                      />
                      <input
                        type="hidden"
                        {...register('parent_email', { required: 'Parent is required' })}
                      />
                      
                      {/* Parent search dropdown */}
                      {showParentSearch && parentSearchResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-xl py-2 text-base ring-1 ring-blue-200 ring-opacity-50 overflow-auto focus:outline-none border border-blue-200">
                          {parentSearchResults.map((parent) => (
                            <div
                              key={parent.id}
                              className="cursor-pointer select-none relative py-3 pl-4 pr-9 hover:bg-blue-50 transition-colors duration-200"
                              onClick={() => handleParentSelect(parent)}
                            >
                              <div className="flex items-center">
                                <span className="font-normal ml-3 block truncate text-gray-900">
                                  {parent.name} ({parent.email})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.parent_email && (
                      <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.parent_email.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Grade
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <select
                      {...register('grade', { required: 'Grade is required' })}
                      className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                    >
                      <option value="" className="text-blue-400">Select grade</option>
                      {GRADES.map((grade) => (
                        <option key={grade} value={grade} className="text-gray-900 bg-white">
                          {typeof grade === 'number' ? `Grade ${grade}` : grade}
                        </option>
                      ))}
                    </select>
                    {errors.grade && (
                      <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.grade.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Class
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      autoComplete="off"
                      {...register('class_assigned')}
                      className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                      placeholder="Enter class (e.g., 7A)"
                    />
                    {errors.class_assigned && (
                      <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.class_assigned.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-8 sm:mt-10">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingStudent(null);
                    reset();
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl hover:bg-blue-50 transition-all duration-200 w-full sm:w-auto order-2 sm:order-1 shadow-soft"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2 shadow-soft hover:shadow-medium transition-all duration-200"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin -ml-1 h-4 w-4 text-white">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
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