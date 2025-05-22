import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { XMarkIcon, EyeIcon, EyeSlashIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { Teacher } from '@/services/teacherService';

interface TeacherListModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  onDeleteTeacher?: (teacherId: string) => Promise<void>;
  readOnly?: boolean;
}

export default function TeacherListModal({ 
  isOpen, 
  onClose, 
  teachers, 
  onDeleteTeacher,
  readOnly = false
}: TeacherListModalProps) {
  const [visibleFields, setVisibleFields] = useState<Record<string, { email: boolean; phone: boolean }>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const toggleFieldVisibility = (teacherEmail: string, field: 'email' | 'phone') => {
    setVisibleFields(prev => ({
      ...prev,
      [teacherEmail]: {
        ...prev[teacherEmail],
        [field]: !prev[teacherEmail]?.[field]
      }
    }));
  };

  const handleDelete = async (teacherId: string) => {
    if (!teacherId || !onDeleteTeacher) {
      toast.error('Invalid teacher ID or delete function not provided');
      return;
    }
    
    try {
      setIsDeleting(teacherId);
      await onDeleteTeacher(teacherId);
      toast.success('Teacher deleted successfully');
    } catch (error) {
      console.error('Delete teacher error:', error);
      if (error instanceof AxiosError && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to delete teacher');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="text-black hover:text-gray-600 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black">
              Teacher Details
            </h2>
          </div>

          <div className="space-y-4">
            {teachers.map((teacher) => (
              <div
                key={teacher.email}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-black">
                      {teacher.name}
                    </h3>
                    {!readOnly && onDeleteTeacher && (
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        disabled={isDeleting === teacher.id}
                        className={`text-red-600 hover:text-red-700 focus:outline-none ${isDeleting === teacher.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Email Field */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black w-20">Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-black">
                        {visibleFields[teacher.email]?.email ? teacher.email : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleFieldVisibility(teacher.email, 'email')}
                        className="text-black hover:text-gray-600"
                      >
                        {visibleFields[teacher.email]?.email ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black w-20">Phone:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-black">
                        {visibleFields[teacher.email]?.phone ? teacher.phone_number : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleFieldVisibility(teacher.email, 'phone')}
                        className="text-black hover:text-gray-600"
                      >
                        {visibleFields[teacher.email]?.phone ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Class Assigned */}
                  {teacher.class_assigned && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-black w-20">Class:</span>
                      <span className="text-sm text-black">{teacher.class_assigned}</span>
                    </div>
                  )}

                  {/* Subjects */}
                  <div className="mt-2">
                    <span className="text-sm text-black w-20 block mb-1">Subjects:</span>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.map((subject) => (
                        <span 
                          key={subject} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {teachers.length === 0 && (
              <div className="text-center py-6 text-black">
                No teachers found
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 