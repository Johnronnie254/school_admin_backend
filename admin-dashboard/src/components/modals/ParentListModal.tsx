import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { XMarkIcon, EyeIcon, EyeSlashIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';
import { Parent } from '@/services/parentService';

interface ParentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  parents: Parent[];
  onDeleteParent?: (parentId: string) => Promise<void>;
  readOnly?: boolean;
}

export default function ParentListModal({ 
  isOpen, 
  onClose, 
  parents, 
  onDeleteParent,
  readOnly = false
}: ParentListModalProps) {
  const [visibleFields, setVisibleFields] = useState<Record<string, { email: boolean; phone: boolean }>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const toggleFieldVisibility = (parentEmail: string, field: 'email' | 'phone') => {
    setVisibleFields(prev => ({
      ...prev,
      [parentEmail]: {
        ...prev[parentEmail],
        [field]: !prev[parentEmail]?.[field]
      }
    }));
  };

  const handleDelete = async (parentId: string) => {
    if (!parentId || !onDeleteParent) {
      toast.error('Invalid parent ID or delete function not provided');
      return;
    }
    
    try {
      setIsDeleting(parentId);
      await onDeleteParent(parentId);
      toast.success('Parent deleted successfully');
    } catch (error) {
      console.error('Delete parent error:', error);
      if (error instanceof AxiosError && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to delete parent');
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
              Parent Details
            </h2>
          </div>

          <div className="space-y-4">
            {parents.map((parent) => (
              <div
                key={parent.email}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-black">
                      {parent.name}
                    </h3>
                    {!readOnly && onDeleteParent && (
                      <button
                        onClick={() => handleDelete(parent.id)}
                        disabled={isDeleting === parent.id}
                        className={`text-red-600 hover:text-red-700 focus:outline-none ${isDeleting === parent.id ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        {visibleFields[parent.email]?.email ? parent.email : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleFieldVisibility(parent.email, 'email')}
                        className="text-black hover:text-gray-600"
                      >
                        {visibleFields[parent.email]?.email ? (
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
                        {visibleFields[parent.email]?.phone ? parent.phone_number : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleFieldVisibility(parent.email, 'phone')}
                        className="text-black hover:text-gray-600"
                      >
                        {visibleFields[parent.email]?.phone ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black w-20">Joined:</span>
                    <span className="text-sm text-black">
                      {new Date(parent.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Children Section */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-black mb-2">Children</h4>
                    <div className="space-y-2">
                      {parent.children && parent.children.length > 0 ? (
                        parent.children.map((child) => (
                          <div key={child.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-black">{child.name}</span>
                            <span className="text-xs text-gray-500">(Grade {child.grade})</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No children found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {parents.length === 0 && (
              <div className="text-center py-6 text-black">
                No parents found
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 