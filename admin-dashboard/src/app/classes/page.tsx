'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, UserGroupIcon, AcademicCapIcon, XMarkIcon, UsersIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';
import { teacherService, Teacher } from '@/services/teacherService';
import { studentService, Student } from '@/services/studentService';
import { Parent } from '@/services/parentService';
import { AxiosError } from 'axios';
import AttendanceModal from '@/components/modals/AttendanceModal';

interface ClassData {
  name: string;
  teachers: Teacher[];
  students: Student[];
  parents: Parent[];
  studentCount: number;
}

interface ClassFormData {
  name: string;
  selectedTeachers: string[];
  selectedStudents: string[];
}

export default function ClassesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassFormData>();

  // Get all teachers
  const { data: teachersData, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: teacherService.getTeachers,
  });

  // Get all students
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: studentService.getStudents,
  });

  const teachers = teachersData?.results || [];
  const students = studentsData?.results || [];

  const isLoading = isLoadingTeachers || isLoadingStudents;

  // Group teachers by class
  const classesByName = teachers.reduce((acc, teacher) => {
    const className = teacher.class_assigned || 'Unassigned';
    if (!acc[className]) {
      acc[className] = { teachers: [], students: [], parents: [] };
    }
    acc[className].teachers.push(teacher);
    return acc;
  }, {} as Record<string, { teachers: Teacher[]; students: Student[]; parents: Parent[] }>);

  // Group students by class and add to classesByName
  students.forEach(student => {
    const className = student.class_assigned || 'Unassigned';
    if (!classesByName[className]) {
      classesByName[className] = { teachers: [], students: [], parents: [] };
    }
    classesByName[className].students.push(student);
    
    // Add parent to the class if student has a parent
    if (student.parent) {
      const parentExists = classesByName[className].parents.some(p => p.id === student.parent.id);
      if (!parentExists) {
        // Create a parent object from the student's parent data
        const parentFromStudent = {
          id: student.parent.id,
          name: student.parent.name,
          email: '', // We don't have this from student data
          phone_number: '', // We don't have this from student data
          school: '', // We don't have this from student data
          created_at: '', // We don't have this from student data
        };
        classesByName[className].parents.push(parentFromStudent);
      }
    }
  });

  // Create class data structure
  const classesData: ClassData[] = Object.entries(classesByName).map(([name, data]) => ({
    name,
    teachers: data.teachers,
    students: data.students,
    parents: data.parents,
    studentCount: data.students.length,
  }));

  // Bulk update assignments
  const updateClassMutation = useMutation({
    mutationFn: async ({ className, teacherIds, studentIds }: { 
      className: string; 
      teacherIds: string[]; 
      studentIds: string[]; 
    }) => {
      const updatePromises: Promise<Teacher | Student>[] = [];

      // Update teachers
      teachers.forEach(teacher => {
        const shouldBeInClass = teacherIds.includes(teacher.id);
        const currentlyInClass = teacher.class_assigned === className;
        
        if (shouldBeInClass && !currentlyInClass) {
          updatePromises.push(teacherService.updateTeacher(teacher.id, { class_assigned: className }));
        } else if (!shouldBeInClass && currentlyInClass) {
          updatePromises.push(teacherService.updateTeacher(teacher.id, { class_assigned: '' }));
        }
      });

      // Update students
      students.forEach(student => {
        const shouldBeInClass = studentIds.includes(student.id);
        const currentlyInClass = student.class_assigned === className;
        
        if (shouldBeInClass && !currentlyInClass) {
          updatePromises.push(studentService.updateStudent(student.id, { class_assigned: className }));
        } else if (!shouldBeInClass && currentlyInClass) {
          updatePromises.push(studentService.updateStudent(student.id, { class_assigned: '' }));
        }
      });
      
      return Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Class assignments updated successfully');
      setIsModalOpen(false);
      setSelectedTeachers([]);
      setSelectedStudents([]);
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
      studentIds: selectedStudents,
    });
  };

  const handleEditClass = (className: string) => {
    setEditingClass(className);
    setIsModalOpen(true);
    const classData = classesByName[className] || { teachers: [], students: [], parents: [] };
    setSelectedTeachers(classData.teachers.map(t => t.id));
    setSelectedStudents(classData.students.map(s => s.id));
    reset({ name: className });
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    setIsModalOpen(true);
    setSelectedTeachers([]);
    setSelectedStudents([]);
    reset({ name: '' });
  };

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setSelectedTeachers([]);
    setSelectedStudents([]);
    setActiveTab('teachers');
    reset();
  };

  const handleViewAttendance = (className: string) => {
    setSelectedClass(className);
    setIsAttendanceModalOpen(true);
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
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {classesData.map((classData) => (
            <div key={classData.name} className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate pr-2">{classData.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewAttendance(classData.name)}
                    className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                    title="View Attendance"
                  >
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleEditClass(classData.name)}
                    className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                    title="Edit Class"
                  >
                    <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Teachers */}
                <div className="flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{classData.teachers.length} Teacher(s)</span>
                </div>

                {/* Students */}
                <div className="flex items-center text-sm text-gray-600">
                  <UsersIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{classData.students.length} Student(s)</span>
                </div>

                {/* Parents */}
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{classData.parents.length} Parent(s)</span>
                </div>
                
                {/* Display assigned members */}
                {(classData.teachers.length > 0 || classData.students.length > 0) ? (
                  <div className="space-y-2">
                    {classData.teachers.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Teachers:</p>
                        <div className="space-y-1">
                          {classData.teachers.slice(0, 2).map((teacher) => (
                            <div key={teacher.id} className="text-sm text-gray-700 bg-blue-50 px-2 py-1 rounded-md border">
                              {teacher.name}
                            </div>
                          ))}
                          {classData.teachers.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{classData.teachers.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {classData.students.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Students:</p>
                        <div className="space-y-1">
                          {classData.students.slice(0, 2).map((student) => (
                            <div key={student.id} className="text-sm text-gray-700 bg-green-50 px-2 py-1 rounded-md border">
                              {student.name}
                            </div>
                          ))}
                          {classData.students.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{classData.students.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No assignments yet</p>
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
          <Dialog.Panel className="relative transform overflow-hidden bg-white sm:rounded-lg px-4 sm:px-6 py-6 sm:py-8 shadow-xl transition-all w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto">
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

              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('teachers')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'teachers'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Teachers ({selectedTeachers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('students')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'students'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Students ({selectedStudents.length})
                  </button>
                </nav>
              </div>

              {/* Teachers Tab */}
              {activeTab === 'teachers' && (
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
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Students to Assign
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                    {students.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {students.map((student) => (
                          <div key={student.id} className="flex items-center p-3 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              id={`student-${student.id}`}
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudent(student.id)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <label htmlFor={`student-${student.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                                {student.name}
                              </label>
                              <p className="text-xs text-gray-500">Grade {student.grade}</p>
                              {student.parent && (
                                <p className="text-xs text-blue-600">Parent: {student.parent.name}</p>
                              )}
                              {student.class_assigned && (
                                <p className="text-xs text-amber-600">Currently assigned to: {student.class_assigned}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No students available
                      </div>
                    )}
                  </div>
                </div>
              )}

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

      {/* Attendance Modal */}
      {selectedClass && (
        <AttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => {
            setIsAttendanceModalOpen(false);
            setSelectedClass(null);
          }}
          className={selectedClass}
        />
      )}
    </div>
  );
} 