'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { superuserService } from '@/services/superuserService';

interface LoginForm {
  email: string;
  password: string;
}

// Hardcoded superuser credentials matching Django backend's ensure_superuser.py
const SUPERUSER_EMAIL = 'educite@gmail.com';
const SUPERUSER_PASSWORD = 'educite@gmail.com';

export default function SuperuserLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      
      if (data.email === SUPERUSER_EMAIL && data.password === SUPERUSER_PASSWORD) {
        const loginResponse = await axios.post(
          'https://educitebackend.co.ke/api/auth/login/', 
          { email: data.email, password: data.password },
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (!loginResponse.data.tokens?.access || !loginResponse.data.tokens?.refresh) {
          toast.error('Authentication failed');
          return;
        }
        
        const token = loginResponse.data.tokens.access;
        const refreshToken = loginResponse.data.tokens.refresh;
        
        const superuserData = {
          id: 'superuser-1',
          email: SUPERUSER_EMAIL,
          name: 'Super User',
          role: 'superuser',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Clear any existing data first
        localStorage.clear();
        
        // Store superuser data
        localStorage.setItem('user', JSON.stringify(superuserData));
        localStorage.setItem('is_superuser', 'true');
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refreshToken);
        
        // Set cookies for middleware authentication
        const cookieOptions = 'path=/; max-age=86400; samesite=lax';
        document.cookie = `is_superuser=true; ${cookieOptions}`;
        document.cookie = `access_token=${token}; ${cookieOptions}`;
        document.cookie = `refresh_token=${refreshToken}; ${cookieOptions}`;
        
        // Verify the connection works
        const testResult = await superuserService.testAuthCall();
        
        if (testResult) {
          toast.success('Login successful');
          // Force a hard reload to the superuser dashboard
          window.location.href = '/superuser';
        } else {
          toast.error('Authentication failed');
          localStorage.clear();
        }
      } else {
        toast.error('Invalid credentials');
      }
    } catch (err) {
      toast.error('An error occurred');
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Superuser Login
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter superuser email"
              defaultValue={SUPERUSER_EMAIL}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register('password', {
                required: 'Password is required'
              })}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter superuser password"
              defaultValue={SUPERUSER_PASSWORD}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Login as Superuser'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}