'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, UserGroupIcon, AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';
import { teacherService, Teacher } from '@/services/teacherService';
import { AxiosError } from 'axios';

interface ClassData {
  name: string;
  teachers: Teacher[];
  studentCount: number;
}

interface ClassFormData {
  name: string;
  selectedTeachers: string[];
}


export default function ClassesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassFormData>();

  // Get all teachers
  const { data: teachersData, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: teacherService.getTeachers,
  });

  const teachers = teachersData?.results || [];

  // Group teachers by class
  const classesByName = teachers.reduce((acc, teacher) => {
    const className = teacher.class_assigned || 'Unassigned';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(teacher);
    return acc;
  }, {} as Record<string, Teacher[]>);

  // Create class data structure
  const classesData: ClassData[] = Object.entries(classesByName).map(([name, teachers]) => ({
    name,
    teachers,
    studentCount: 0, // You can extend this to count students
  }));

  // Bulk update teachers' class assignments
  const updateClassMutation = useMutation({
    mutationFn: async ({ className, teacherIds }: { className: string; teacherIds: string[] }) => {
      const updatePromises = teachers.map(teacher => {
        const shouldBeInClass = teacherIds.includes(teacher.id);
        const currentlyInClass = teacher.class_assigned === className;
        
        if (shouldBeInClass && !currentlyInClass) {
          // Assign teacher to this class
          return teacherService.updateTeacher(teacher.id, { class_assigned: className });
        } else if (!shouldBeInClass && currentlyInClass) {
          // Remove teacher from this class
          return teacherService.updateTeacher(teacher.id, { class_assigned: '' });
        }
        return Promise.resolve(teacher);
      });
      
      return Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Class assignments updated successfully');
      setIsModalOpen(false);
      setSelectedTeachers([]);
      setEditingClass(null);
      reset();
    },
    onError: (error: AxiosError | Error) => {
      console.error('Error updating class assignments:', error);
      const message = error instanceof AxiosError ? error.response?.data?.message : error.message;
      toast.error(message || 'Failed to update class assignments');
    },
  });

  const onSubmit = (data: ClassFormData) => {
    if (!data.name.trim()) {
      toast.error('Please enter a class name');
      return;
    }
    
    updateClassMutation.mutate({
      className: data.name.trim(),
      teacherIds: selectedTeachers,
    });
  };

  const handleEditClass = (className: string) => {
    setEditingClass(className);
    setIsModalOpen(true);
    const classTeachers = classesByName[className] || [];
    setSelectedTeachers(classTeachers.map(t => t.id));
    reset({ name: className });
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    setIsModalOpen(true);
    setSelectedTeachers([]);
    reset({ name: '' });
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setSelectedTeachers([]);
    reset();
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-full bg-blue-50 p-1.5 sm:p-2">
            <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Class Management</h1>
        </div>
        <button
          onClick={handleCreateClass}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Assign Class
        </button>
      </div>

      {/* Classes Grid */}
      {isLoadingTeachers ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {classesData.map((classData) => (
            <div key={classData.name} className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate pr-2">{classData.name}</h3>
                <button
                  onClick={() => handleEditClass(classData.name)}
                  className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                >
                  <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{classData.teachers.length} Teacher(s) Assigned</span>
                </div>
                
                {classData.teachers.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned Teachers:</p>
                    <div className="space-y-1">
                      {classData.teachers.map((teacher) => (
                        <div key={teacher.id} className="text-sm text-gray-700 bg-gray-50 px-2 py-1.5 rounded-md border">
                          {teacher.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No teachers assigned</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        className="relative z-50"
      >
        {/* Background blur - visible only on non-mobile */}
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm hidden sm:block" aria-hidden="true" />
        
        {/* Modal container - full screen on mobile */}
        <div className="fixed inset-0 flex items-center justify-center sm:p-4">
          <Dialog.Panel className="relative transform overflow-hidden bg-white sm:rounded-lg px-4 sm:px-6 py-6 sm:py-8 shadow-xl transition-all w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
            <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <div className="rounded-full bg-blue-50 p-1.5 sm:p-2">
                <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <Dialog.Title className="text-base sm:text-lg font-semibold leading-6 text-gray-900">
                {editingClass ? `Edit ${editingClass}` : 'Create Class Assignment'}
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Class Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-1.5 sm:mt-2">
                  <input
                    type="text"
                    autoComplete="off"
                    {...register('name', { required: 'Class name is required' })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm sm:leading-6"
                    placeholder="e.g., Grade 7A, Form 3B, Year 5"
                  />
                  {errors.name && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.name.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Teachers to Assign
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                  {teachers.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {teachers.map((teacher) => (
                        <div key={teacher.id} className="flex items-center p-3 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`teacher-${teacher.id}`}
                            checked={selectedTeachers.includes(teacher.id)}
                            onChange={() => toggleTeacher(teacher.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <label htmlFor={`teacher-${teacher.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                              {teacher.name}
                            </label>
                            <p className="text-xs text-gray-500">{teacher.email}</p>
                            {teacher.class_assigned && (
                              <p className="text-xs text-amber-600">Currently assigned to: {teacher.class_assigned}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No teachers available
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {selectedTeachers.length} teacher(s) selected
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateClassMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2"
                >
                  {updateClassMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      Updating...
                    </div>
                  ) : (
                    editingClass ? 'Update Assignment' : 'Create Assignment'
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