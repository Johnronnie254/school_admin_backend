'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superuserService } from '@/services/superuserService';
import type { User } from '@/services/superuserService';

interface UserFormProps {
  onSubmit: (data: Partial<User>) => Promise<void>;
  onCancel: () => void;
}

export default function UserForm({ onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'admin',
    school_id: '',
  });

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: superuserService.getSchools,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="first_name" className="block text-sm font-medium text-black">
          First Name
        </label>
        <input
          type="text"
          name="first_name"
          id="first_name"
          required
          value={formData.first_name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
        />
      </div>

      <div>
        <label htmlFor="last_name" className="block text-sm font-medium text-black">
          Last Name
        </label>
        <input
          type="text"
          name="last_name"
          id="last_name"
          required
          value={formData.last_name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-black">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-black">
          Role
        </label>
        <select
          name="role"
          id="role"
          required
          value={formData.role}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
        >
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      <div>
        <label htmlFor="school_id" className="block text-sm font-medium text-black">
          School
        </label>
        <select
          name="school_id"
          id="school_id"
          required
          value={formData.school_id}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black py-2 px-3"
        >
          <option value="">Select a school</option>
          {schools?.map(school => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-black bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Create User
        </button>
      </div>
    </form>
  );
} 