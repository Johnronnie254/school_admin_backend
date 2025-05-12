'use client';

import { useForm } from 'react-hook-form';

interface AdminData {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  role?: string;
}

interface AdminFormProps {
  initialData?: AdminData | null;
  onSubmit: (data: AdminData) => void;
  onCancel: () => void;
}

export default function AdminForm({ initialData, onSubmit, onCancel }: AdminFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<AdminData>({
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      password: initialData?.password || '',
      phone_number: initialData?.phone_number || ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-black">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          {...register('name', { required: 'Full name is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
          placeholder="Enter full name"
          autoComplete="off"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
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