'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  // Check if already logged in as superuser
  useEffect(() => {
    const isSuperuser = localStorage.getItem('is_superuser') === 'true';
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    console.log('🔑 Checking if already logged in as superuser:', isSuperuser);
    
    if (isSuperuser && user && token) {
      console.log('✅ Already logged in as superuser, redirecting to dashboard');
      router.push('/superuser/dashboard');
    }
  }, [router]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      console.log('🔑 Attempting superuser login');
      
      // Check for hardcoded superuser credentials
      if (data.email === SUPERUSER_EMAIL && data.password === SUPERUSER_PASSWORD) {
        console.log('✅ Superuser credentials valid');
        
        try {
          // Make a real API call to get a token from the Django backend
          const loginResponse = await axios.post(
            'https://educitebackend.co.ke/api/auth/login/', 
            { email: data.email, password: data.password },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          console.log('✅ Backend authentication successful, response:', loginResponse.data);
          
          // Extract the token from the response
          if (!loginResponse.data.tokens?.access || !loginResponse.data.tokens?.refresh) {
            console.error('❌ Authentication response missing tokens:', loginResponse.data);
            toast.error('Authentication response missing tokens');
            setIsLoading(false);
            return;
          }
          
          const token = loginResponse.data.tokens.access;
          const refreshToken = loginResponse.data.tokens.refresh;
          
          console.log('🎫 Retrieved tokens - Access token exists:', !!token);
          console.log('🎫 Retrieved tokens - Refresh token exists:', !!refreshToken);
          
          // Create a superuser session
          const superuserData = {
            id: 'superuser-1',
            email: SUPERUSER_EMAIL,
            name: 'Super User',
            role: 'superuser',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Store superuser data in localStorage
          localStorage.clear(); // Clear any existing data first
          localStorage.setItem('user', JSON.stringify(superuserData));
          localStorage.setItem('is_superuser', 'true');
          localStorage.setItem('access_token', token);
          localStorage.setItem('refresh_token', refreshToken);
          console.log('📦 Stored superuser data and tokens in localStorage');
          
          // Test token retrieval immediately
          const testToken = localStorage.getItem('access_token');
          console.log('🔍 Test access token retrieval:', testToken ? 'Success' : 'Failed');
          
          // Make a test API call to verify the token works
          try {
            // Test the API connection
            console.log('🔍 Testing API connection with new token');
            const testResult = await superuserService.testAuthCall();
            if (testResult) {
              console.log('✅ API connection test successful');
            } else {
              console.log('⚠️ API connection test failed but continuing');
            }
            
            // Set cookies for middleware authentication
            const cookieOptions = 'path=/; max-age=86400; samesite=lax';
            document.cookie = `is_superuser=true; ${cookieOptions}`;
            document.cookie = `access_token=${token}; ${cookieOptions}`;
            document.cookie = `refresh_token=${refreshToken}; ${cookieOptions}`;
            console.log('🍪 Set superuser cookies for middleware authentication');
            
            toast.success('Superuser login successful');
            console.log('🚀 Redirecting to superuser dashboard');
            
            // Force a delay to ensure localStorage and cookies are set
            setTimeout(() => {
              router.push('/superuser/dashboard');
            }, 300);
          } catch (testError) {
            console.error('❌ Test API call failed:', testError);
            toast.error('Authentication verified but API access failed');
          }
        } catch (apiError: any) {
          console.error('❌ Backend authentication failed:', apiError);
          console.error('❌ Error details:', apiError.response?.data);
          toast.error('Authentication failed with the backend. Please check your credentials.');
        }
      } else {
        console.log('❌ Invalid superuser credentials');
        toast.error('Invalid superuser credentials');
      }
    } catch (err) {
      console.error('❌ Error during superuser login:', err);
      toast.error('An unexpected error occurred');
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
              defaultValue={SUPERUSER_EMAIL} // Pre-fill for easy testing
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
              defaultValue={SUPERUSER_PASSWORD} // Pre-fill for easy testing
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
        
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>This is a restricted area for superusers only.</p>
        </div>
      </div>
    </div>
  );
} 