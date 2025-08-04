'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  PlusCircleIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/outline';
import calendarService, { SchoolEvent, CreateEventData } from '@/services/calendarService';
import { Dialog } from '@/components/ui/dialog';
import { AxiosError } from 'axios';

const eventTypes = [
  { value: 'holiday', label: 'Holiday' },
  { value: 'exam', label: 'Examination' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'activity', label: 'Activity' }
] as const;

const participantGroups = [
  { value: 'all', label: 'Everyone' },
  { value: 'teachers', label: 'Teachers Only' },
  { value: 'students', label: 'Students Only' },
  { value: 'parents', label: 'Parents Only' }
] as const;

export default function CalendarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEventData>();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await calendarService.getEvents();
      return response.results;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEventData) => calendarService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully');
      handleCloseModal();
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast.error(error.response?.data?.detail || 'Failed to create event');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateEventData & { id: string }) => 
      calendarService.updateEvent(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated successfully');
      handleCloseModal();
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast.error(error.response?.data?.detail || 'Failed to update event');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully');
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      toast.error(error.response?.data?.detail || 'Failed to delete event');
    }
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    reset();
  };

  const onSubmit = (data: CreateEventData) => {
    if (editingEvent) {
      updateMutation.mutate({ ...data, id: editingEvent.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (event: SchoolEvent) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(event.id);
    }
  };

  if (isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 shadow-soft backdrop-blur-sm border border-blue-200/20 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 text-sm font-medium text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 p-2 shadow-soft">
            <CalendarDaysIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">School Calendar</h1>
            <p className="text-sm text-gray-600">Manage school events and activities</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-soft transition-all duration-200"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add Event
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 shadow-soft backdrop-blur-sm border border-blue-200/20 max-w-md mx-auto">
            <CalendarDaysIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-600 mb-2">No events scheduled</h3>
            <p className="text-sm text-gray-600 mb-4">Get started by adding a new event to the calendar.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-soft transition-all duration-200"
            >
              <PlusCircleIcon className="h-4 w-4" />
              Add First Event
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border border-blue-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-100/50">
              <thead className="bg-gradient-to-r from-blue-50/80 to-blue-100/60 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Participants</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-blue-100/30">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-600 truncate max-w-xs">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-lg shadow-soft backdrop-blur-sm border ${
                        event.event_type === 'holiday' ? 'bg-green-100/80 text-green-800 border-green-200/50' :
                        event.event_type === 'exam' ? 'bg-red-100/80 text-red-800 border-red-200/50' :
                        event.event_type === 'meeting' ? 'bg-blue-100/80 text-blue-800 border-blue-200/50' :
                        event.event_type === 'activity' ? 'bg-yellow-100/80 text-yellow-800 border-yellow-200/50' :
                        'bg-gray-100/80 text-gray-800 border-gray-200/50'
                      }`}>
                        {event.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(event.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(event.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {event.participants}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 shadow-soft transition-all duration-200"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event)}
                          className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold rounded-lg hover:from-red-700 hover:to-red-600 shadow-soft transition-all duration-200"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        className="relative z-50"
      >
        {/* Background blur - visible only on non-mobile */}
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm hidden sm:block" aria-hidden="true" />
        
        {/* Modal container - full screen on mobile */}
        <div className="fixed inset-0 flex items-center justify-center sm:p-4">
          <Dialog.Panel className="relative transform overflow-hidden bg-white/90 backdrop-blur-sm sm:rounded-xl px-4 sm:px-6 py-6 sm:py-8 shadow-soft transition-all w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto border border-blue-100/50">
            <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors duration-200"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 p-2 shadow-soft">
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-blue-600">
                  {editingEvent ? 'Edit Event' : 'Add New Event'}
                </Dialog.Title>
                <p className="text-sm text-gray-600">
                  {editingEvent ? 'Update event information' : 'Create a new event for the school calendar'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-blue-600 mb-2">
                    Title
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    defaultValue={editingEvent?.title}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200/50 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200"
                    placeholder="Enter event title"
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.title.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-blue-600 mb-2">
                    Description
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    defaultValue={editingEvent?.description}
                    rows={3}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200/50 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200"
                    placeholder="Enter event description"
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-2">
                    Start Date
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('start_date', { required: 'Start date is required' })}
                    defaultValue={editingEvent?.start_date?.split('T')[0]}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200/50 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200"
                  />
                  {errors.start_date && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.start_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-2">
                    End Date
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('end_date', { required: 'End date is required' })}
                    defaultValue={editingEvent?.end_date?.split('T')[0]}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200/50 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200"
                  />
                  {errors.end_date && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.end_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-2">
                    Event Type
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    {...register('event_type', { required: 'Event type is required' })}
                    defaultValue={editingEvent?.event_type}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200/50 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Select type</option>
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.event_type && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.event_type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-600 mb-2">
                    Participants
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    {...register('participants', { required: 'Participants is required' })}
                    defaultValue={editingEvent?.participants}
                    className="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 shadow-soft ring-1 ring-inset ring-blue-200/50 focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white/70 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Select participants</option>
                    {participantGroups.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                  {errors.participants && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.participants.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg px-6 py-3 text-sm font-semibold text-gray-700 bg-white/70 backdrop-blur-sm shadow-soft ring-1 ring-inset ring-blue-200/50 hover:bg-white/90 transition-all duration-200 disabled:opacity-50"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-soft hover:from-blue-700 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingEvent ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <>{editingEvent ? 'Update Event' : 'Create Event'}</>
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