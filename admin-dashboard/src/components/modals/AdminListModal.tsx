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

  const toggleFieldVisibility = (adminEmail: string, field: 'email' | 'password') => {
    setVisibleFields(prev => ({
      ...prev,
      [adminEmail]: {
        ...prev[adminEmail],
        [field]: !prev[adminEmail]?.[field]
      }
    }));
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
              Administrator Credentials - {schoolName}
            </h2>
          </div>

          <div className="space-y-4">
            {admins.map((admin) => (
              <div
                key={admin.email}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-black">
                    {admin.first_name} {admin.last_name}
                  </h3>
                  
                  {/* Email Field */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black w-20">Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-black">
                        {visibleFields[admin.email]?.email ? admin.email : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleFieldVisibility(admin.email, 'email')}
                        className="text-black hover:text-gray-600"
                      >
                        {visibleFields[admin.email]?.email ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black w-20">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-black">
                        {visibleFields[admin.email]?.password ? admin.password : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleFieldVisibility(admin.email, 'password')}
                        className="text-black hover:text-gray-600"
                      >
                        {visibleFields[admin.email]?.password ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {admins.length === 0 && (
              <div className="text-center py-6 text-black">
                No administrators found for this school
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}