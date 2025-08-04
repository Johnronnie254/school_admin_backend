'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import {
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { notificationService, type Notification, type NotificationFormData } from '@/services/notificationService';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function NotificationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NotificationFormData>();

  // Fetch notifications with proper typing
  const { data, isLoading } = useQuery<{ results: Notification[] }>({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications
  });

  const notifications = data?.results || [];

  // Create notification mutation
  const createMutation = useMutation({
    mutationFn: notificationService.createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to create notification');
      }
    }
  });

  // Update notification mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationFormData> }) =>
      notificationService.updateNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification updated successfully');
      setIsModalOpen(false);
      setEditingNotification(null);
      reset();
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to update notification');
      }
    }
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted successfully');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to delete notification');
      }
    }
  });

  const onSubmit = (data: NotificationFormData) => {
    if (editingNotification) {
      updateMutation.mutate({ id: editingNotification.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    reset({
      message: notification.message,
      target_group: notification.target_group
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-soft backdrop-blur-sm">
            <BellIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Notifications Management</h1>
            <p className="text-sm text-gray-600 mt-1">Create and manage notifications for different user groups</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setEditingNotification(null);
            reset();
          }}
          className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-soft backdrop-blur-sm transition-all duration-200 w-full sm:w-auto"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Notification
        </button>
      </div>

      {/* Table for desktop, Cards for mobile */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-gray-500 mt-4">Loading notifications...</p>
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 shadow-soft backdrop-blur-sm border border-blue-200/20 max-w-md mx-auto">
            <BellIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-600 mb-2">No Notifications Yet</h3>
            <p className="text-sm text-gray-600 mb-6">Get started by creating your first notification to reach teachers and parents.</p>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setEditingNotification(null);
                reset();
              }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-soft transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create First Notification
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden sm:block bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border border-blue-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100/50">
                <thead className="bg-gradient-to-r from-blue-50/80 to-blue-100/60 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Target Group
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-blue-100/30">
                  {notifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 max-w-xs">
                        <div className="line-clamp-2">{notification.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center rounded-lg bg-blue-100/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-blue-800 border border-blue-200/50">
                          {notification.target_group}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(notification)}
                            className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-blue-50 transition-all duration-200"
                            title="Edit notification"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg p-2 hover:bg-red-50 transition-all duration-200"
                            title="Delete notification"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Mobile Cards - Shown only on mobile */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border border-blue-100/50 p-6 hover:shadow-lg hover:border-blue-200/50 transition-all duration-300">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-3 line-clamp-3">{notification.message}</p>
                    <div className="flex flex-col gap-2">
                      <span className="inline-flex items-center rounded-lg bg-blue-100/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-blue-800 border border-blue-200/50 w-fit">
                        {notification.target_group}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEdit(notification)}
                      className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-blue-50 transition-all duration-200"
                      title="Edit notification"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg p-2 hover:bg-red-50 transition-all duration-200"
                      title="Delete notification"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNotification(null);
          reset();
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md px-6 py-8 shadow-2xl transition-all w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-blue-100/50">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingNotification(null);
                  reset();
                }}
                className="text-gray-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-blue-50 transition-all duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-soft backdrop-blur-sm">
                <BellIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-blue-600">
                  {editingNotification ? 'Edit Notification' : 'Create New Notification'}
                </Dialog.Title>
                <p className="text-sm text-gray-600 mt-1">Send messages to teachers and parents</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                  Message
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-2">
                  <textarea
                    {...register('message', { 
                      required: 'Message is required',
                      minLength: { value: 10, message: 'Message must be at least 10 characters' },
                      maxLength: { value: 500, message: 'Message cannot exceed 500 characters' }
                    })}
                    rows={4}
                    className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200 placeholder:text-blue-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-blue-50/50 backdrop-blur-sm text-sm sm:leading-6 transition-all duration-200 resize-none"
                    placeholder="Enter your notification message..."
                  />
                  {errors.message && (
                    <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Target Group
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="space-y-3">
                  <div className="flex items-center p-3 rounded-xl bg-blue-50/50 backdrop-blur-sm border border-blue-100/50 hover:bg-blue-50/70 transition-colors duration-200">
                    <input
                      {...register('target_group', { required: 'Target group is required' })}
                      type="radio"
                      value="all"
                      className="h-4 w-4 border-blue-300 text-blue-600 focus:ring-blue-600"
                    />
                    <label className="ml-3 block text-sm font-semibold text-gray-700 cursor-pointer">
                      Everyone
                    </label>
                  </div>
                  <div className="flex items-center p-3 rounded-xl bg-blue-50/50 backdrop-blur-sm border border-blue-100/50 hover:bg-blue-50/70 transition-colors duration-200">
                    <input
                      {...register('target_group')}
                      type="radio"
                      value="teachers"
                      className="h-4 w-4 border-blue-300 text-blue-600 focus:ring-blue-600"
                    />
                    <label className="ml-3 block text-sm font-semibold text-gray-700 cursor-pointer">
                      Teachers Only
                    </label>
                  </div>
                  <div className="flex items-center p-3 rounded-xl bg-blue-50/50 backdrop-blur-sm border border-blue-100/50 hover:bg-blue-50/70 transition-colors duration-200">
                    <input
                      {...register('target_group')}
                      type="radio"
                      value="parents"
                      className="h-4 w-4 border-blue-300 text-blue-600 focus:ring-blue-600"
                    />
                    <label className="ml-3 block text-sm font-semibold text-gray-700 cursor-pointer">
                      Parents Only
                    </label>
                  </div>
                </div>
                {errors.target_group && (
                  <p className="mt-2 text-sm text-red-600">{errors.target_group.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingNotification(null);
                    reset();
                  }}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-blue-700 shadow-soft ring-1 ring-inset ring-blue-200 hover:bg-blue-50 disabled:opacity-50 w-full sm:w-auto order-2 sm:order-1 bg-blue-50/50 backdrop-blur-sm transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-soft hover:from-blue-700 hover:to-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 w-full sm:w-auto order-1 sm:order-2 backdrop-blur-sm transition-all duration-200"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 text-white">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      {editingNotification ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingNotification ? 'Update Notification' : 'Create Notification'
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