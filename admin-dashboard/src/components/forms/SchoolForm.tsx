'use client';

import { useForm } from 'react-hook-form';
import { School } from '@/services/superuserService';

interface SchoolFormProps {
  initialData?: School | null;
  onSubmit: (data: Partial<School>) => void;
  onCancel: () => void;
}

export default function SchoolForm({ initialData, onSubmit, onCancel }: SchoolFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<Partial<School>>({
    defaultValues: initialData || {
      name: '',
      address: '',
      contact_email: '',
      contact_phone: '',
      is_active: true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          School Name
        </label>
        <input
          type="text"
          id="name"
          {...register('name', { required: 'School name is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          id="address"
          {...register('address', { required: 'Address is required' })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
          Contact Email
        </label>
        <input
          type="email"
          id="contact_email"
          {...register('contact_email', {
            required: 'Contact email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.contact_email && (
          <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
          Contact Phone
        </label>
        <input
          type="tel"
          id="contact_phone"
          {...register('contact_phone', { required: 'Contact phone is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {errors.contact_phone && (
          <p className="mt-1 text-sm text-red-600">{errors.contact_phone.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          {...register('is_active')}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {initialData ? 'Update School' : 'Create School'}
        </button>
      </div>
    </form>
  );
} 