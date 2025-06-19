'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
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

const PREDEFINED_CLASSES = [
  'Grade 1A', 'Grade 1B', 'Grade 2A', 'Grade 2B',
  'Grade 3A', 'Grade 3B', 'Grade 4A', 'Grade 4B',
  'Grade 5A', 'Grade 5B', 'Grade 6A', 'Grade 6B',
  'Grade 7A', 'Grade 7B', 'Grade 8A', 'Grade 8B'
];

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
      reset();
    },
    onError: (error: AxiosError | Error) => {
      console.error('Error updating class assignments:', error);
      const message = error instanceof AxiosError ? error.response?.data?.message : error.message;
      toast.error(message || 'Failed to update class assignments');
    },
  });

  const onSubmit = (data: ClassFormData) => {
    updateClassMutation.mutate({
      className: data.name,
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">Class Management</h1>
        </div>
        <button
          onClick={handleCreateClass}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Assign Class
        </button>
      </div>

      {/* Classes Grid */}
      {isLoadingTeachers ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classesData.map((classData) => (
            <div key={classData.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">{classData.name}</h3>
                <button
                  onClick={() => handleEditClass(classData.name)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="w-4 h-4 mr-2" />
                  {classData.teachers.length} Teacher(s) Assigned
                </div>
                
                {classData.teachers.length > 0 ? (
                  <div className="space-y-1">
                    {classData.teachers.map((teacher) => (
                      <div key={teacher.id} className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        {teacher.name}
                      </div>
                    ))}
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {editingClass ? `Edit ${editingClass}` : 'Create Class Assignment'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Name
                  </label>
                  {editingClass ? (
                    <input
                      type="text"
                      value={editingClass}
                      disabled
                      className="block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500"
                    />
                  ) : (
                    <select
                      {...register('name', { required: 'Class name is required' })}
                      className="block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a class</option>
                      {PREDEFINED_CLASSES.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Teachers
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center py-2">
                        <input
                          type="checkbox"
                          id={teacher.id}
                          checked={selectedTeachers.includes(teacher.id)}
                          onChange={() => toggleTeacher(teacher.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={teacher.id} className="ml-3 text-sm">
                          <div className="font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-gray-500">{teacher.email}</div>
                          {teacher.class_assigned && (
                            <div className="text-xs text-blue-600">
                              Currently: {teacher.class_assigned}
                            </div>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateClassMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateClassMutation.isPending ? 'Updating...' : 'Update Assignments'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 