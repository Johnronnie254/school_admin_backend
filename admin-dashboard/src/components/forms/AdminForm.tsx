'use client';

import { useForm } from 'react-hook-form';

interface AdminData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone_number: string;
  role?: string;
}

interface AdminFormProps {
  initialData?: AdminData | null;
  onSubmit: (data: AdminData) => void;
  onCancel: () => void;
}

export default function AdminForm({ initialData, onSubmit, onCancel }: AdminFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<AdminData>({
    defaultValues: {
      first_name: initialData?.first_name || '',
      last_name: initialData?.last_name || '',
      email: initialData?.email || '',
      password: initialData?.password || '',
      password_confirmation: initialData?.password_confirmation || '',
      phone_number: initialData?.phone_number || ''
    }
  });

  const password = watch('password');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-black">
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            {...register('first_name', { required: 'First name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
            placeholder="Enter first name"
            autoComplete="off"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-black">
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            {...register('last_name', { required: 'Last name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
            placeholder="Enter last name"
            autoComplete="off"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="admin_email" className="block text-sm font-medium text-black">
          Email Address
        </label>
        <input
          type="email"
          id="admin_email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
          placeholder="admin@example.com"
          autoComplete="off"
          data-form-type="other"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="admin_password" className="block text-sm font-medium text-black">
          Password
        </label>
        <input
          type="password"
          id="admin_password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
          placeholder="••••••••"
          autoComplete="new-password"
          data-form-type="other"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password_confirmation" className="block text-sm font-medium text-black">
          Confirm Password
        </label>
        <input
          type="password"
          id="password_confirmation"
          {...register('password_confirmation', {
            required: 'Please confirm your password',
            validate: value => value === password || 'The passwords do not match'
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
          placeholder="••••••••"
          autoComplete="new-password"
          data-form-type="other"
        />
        {errors.password_confirmation && (
          <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-black">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone_number"
          {...register('phone_number', {
            required: 'Phone number is required',
            pattern: {
              value: /^[0-9+\-\s()]*$/,
              message: 'Invalid phone number format'
            }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
          placeholder="+254 XXX XXX XXX"
          autoComplete="off"
        />
        {errors.phone_number && (
          <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {initialData ? 'Update Administrator' : 'Create Administrator'}
        </button>
      </div>
    </form>
  );
} 