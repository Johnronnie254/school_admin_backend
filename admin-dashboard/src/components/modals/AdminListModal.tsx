import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { AdminUserResponse } from '@/services/superuserService';

interface AdminListModalProps {
  isOpen: boolean;
  onClose: () => void;
  admins: AdminUserResponse[];
  schoolName: string;
}

export default function AdminListModal({ isOpen, onClose, admins, schoolName }: AdminListModalProps) {
  const [visibleFields, setVisibleFields] = useState<Record<string, { email: boolean; password: boolean }>>({});

  const toggleFieldVisibility = (adminId: string, field: 'email' | 'password') => {
    setVisibleFields(prev => ({
      ...prev,
      [adminId]: {
        ...prev[adminId],
        [field]: !prev[adminId]?.[field]
      }
    }));
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getRandomColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Administrators - {schoolName}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              List of all administrators and their details
            </p>
          </div>

          <div className="space-y-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 h-12 w-12 rounded-full ${getRandomColor(`${admin.first_name} ${admin.last_name}`)} flex items-center justify-center text-white font-semibold`}>
                    {getInitials(admin.first_name, admin.last_name)}
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium text-gray-900">
                      {admin.first_name} {admin.last_name}
                    </h3>
                    
                    <div className="mt-2 space-y-2">
                      {/* Email Field */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-20">Email:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {visibleFields[admin.id]?.email ? admin.email : '••••••••••••••••'}
                          </span>
                          <button
                            onClick={() => toggleFieldVisibility(admin.id, 'email')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {visibleFields[admin.id]?.email ? (
                              <EyeSlashIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Created At Field */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-20">Created:</span>
                        <span className="text-sm text-gray-700">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {admins.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                No administrators found for this school
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 