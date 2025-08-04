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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-soft backdrop-blur-sm">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Class Management</h1>
            <p className="text-sm text-gray-600 mt-1">Organize teachers and students into classes</p>
          </div>
        </div>
        <button
          onClick={handleCreateClass}
          className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-soft backdrop-blur-sm transition-all duration-200 w-full sm:w-auto"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Assign Class
        </button>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-gray-500 mt-4">Loading classes...</p>
        </div>
      ) : classesData.length === 0 ? (
        <div className="text-center py-16">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-soft backdrop-blur-sm border border-blue-200/20 max-w-md mx-auto">
            <AcademicCapIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-600 mb-2">No Classes Yet</h3>
            <p className="text-sm text-gray-600 mb-6">Create your first class assignment to get started with organizing your school.</p>
            <button
              onClick={handleCreateClass}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-soft transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create First Class
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classesData.map((classData) => (
            <div key={classData.name} className="bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border border-blue-100/50 p-6 hover:shadow-lg hover:border-blue-200/50 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-gray-900 truncate pr-2 group-hover:text-blue-600 transition-colors duration-200">{classData.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewAttendance(classData.name)}
                    className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-blue-50 transition-all duration-200"
                    title="View Attendance"
                  >
                    <CalendarIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEditClass(classData.name)}
                    className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-blue-50 transition-all duration-200"
                    title="Edit Class"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 mx-auto mb-2">
                      <UserGroupIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{classData.teachers.length}</p>
                    <p className="text-xs text-gray-500">Teachers</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 mx-auto mb-2">
                      <UsersIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{classData.students.length}</p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 mx-auto mb-2">
                      <UserIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{classData.parents.length}</p>
                    <p className="text-xs text-gray-500">Parents</p>
                  </div>
                </div>
                
                {/* Display assigned members */}
                {(classData.teachers.length > 0 || classData.students.length > 0) ? (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    {classData.teachers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Teachers</p>
                        <div className="space-y-2">
                          {classData.teachers.slice(0, 2).map((teacher) => (
                            <div key={teacher.id} className="text-sm text-gray-700 bg-blue-50/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-blue-100/50 shadow-soft">
                              {teacher.name}
                            </div>
                          ))}
                          {classData.teachers.length > 2 && (
                            <div className="text-xs text-blue-500 font-medium">
                              +{classData.teachers.length - 2} more teachers
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {classData.students.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Students</p>
                        <div className="space-y-2">
                          {classData.students.slice(0, 2).map((student) => (
                            <div key={student.id} className="text-sm text-gray-700 bg-green-50/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-100/50 shadow-soft">
                              {student.name}
                            </div>
                          ))}
                          {classData.students.length > 2 && (
                            <div className="text-xs text-green-500 font-medium">
                              +{classData.students.length - 2} more students
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 italic text-center py-4">No assignments yet</p>
                  </div>
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md px-6 py-8 shadow-2xl transition-all w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-blue-100/50">
            <div className="absolute right-4 top-4">
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-blue-50 transition-all duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-soft backdrop-blur-sm">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-blue-600">
                  {editingClass ? `Edit ${editingClass}` : 'Create Class Assignment'}
                </Dialog.Title>
                <p className="text-sm text-gray-600 mt-1">Assign teachers and students to classes</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Class Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    autoComplete="off"
                    {...register('name', { required: 'Class name is required' })}
                    className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200"
                    placeholder="e.g., Grade 7A, Form 3B, Year 5"
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-blue-100">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('teachers')}
                    className={`py-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'teachers'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
                    }`}
                  >
                    Teachers ({selectedTeachers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('students')}
                    className={`py-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'students'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
                    }`}
                  >
                    Students ({selectedStudents.length})
                  </button>
                </nav>
              </div>

              {/* Teachers Tab */}
              {activeTab === 'teachers' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Select Teachers to Assign
                  </label>
                  <div className="max-h-80 overflow-y-auto rounded-xl border border-blue-200/50 bg-blue-50/30 backdrop-blur-sm">
                    {teachers.length > 0 ? (
                      <div className="divide-y divide-blue-100/50">
                        {teachers.map((teacher) => (
                          <div key={teacher.id} className="flex items-center p-4 hover:bg-blue-50/50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              id={`teacher-${teacher.id}`}
                              checked={selectedTeachers.includes(teacher.id)}
                              onChange={() => toggleTeacher(teacher.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded transition-colors duration-200"
                            />
                            <div className="ml-4 flex-1">
                              <label htmlFor={`teacher-${teacher.id}`} className="text-sm font-semibold text-gray-900 cursor-pointer">
                                {teacher.name}
                              </label>
                              <p className="text-xs text-gray-600 mt-1">{teacher.email}</p>
                              {teacher.class_assigned && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-medium">
                                    Currently: {teacher.class_assigned}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <UserGroupIcon className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No teachers available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Select Students to Assign
                  </label>
                  <div className="max-h-80 overflow-y-auto rounded-xl border border-green-200/50 bg-green-50/30 backdrop-blur-sm">
                    {students.length > 0 ? (
                      <div className="divide-y divide-green-100/50">
                        {students.map((student) => (
                          <div key={student.id} className="flex items-center p-4 hover:bg-green-50/50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              id={`student-${student.id}`}
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudent(student.id)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-green-300 rounded transition-colors duration-200"
                            />
                            <div className="ml-4 flex-1">
                              <label htmlFor={`student-${student.id}`} className="text-sm font-semibold text-gray-900 cursor-pointer">
                                {student.name}
                              </label>
                              <p className="text-xs text-gray-600 mt-1">Grade {student.grade}</p>
                              {student.parent && (
                                <p className="text-xs text-blue-600 mt-1">Parent: {student.parent.name}</p>
                              )}
                              {student.class_assigned && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-medium">
                                    Currently: {student.class_assigned}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <UsersIcon className="h-12 w-12 text-green-300 mx-auto mb-4" />
                        <p className="text-sm text-gray-500">No students available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-blue-700 shadow-soft ring-1 ring-inset ring-blue-200 hover:bg-blue-50 disabled:opacity-50 w-full sm:w-auto order-2 sm:order-1 bg-blue-50/50 backdrop-blur-sm transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateClassMutation.isPending}
                  className="inline-flex justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-soft hover:from-blue-700 hover:to-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2 backdrop-blur-sm transition-all duration-200"
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
                    editingClass ? 'Update Class' : 'Assign Class'
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