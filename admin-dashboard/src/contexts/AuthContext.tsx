'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { User, ApiError, RegisterData, ResetPasswordData, ConfirmResetData } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperuser: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmReset: (data: ConfirmResetData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Computed property for superuser role
  const isSuperuser = user?.role === 'superuser';

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Only try to get current user if we have a token
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear tokens if there's an error
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      setUser(response.user);
      toast.success('Login successful');
      
      // Check user role and redirect accordingly
      if (response.user.role === 'superuser') {
        router.push('/superuser');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await authService.register(data);
      setUser(response.user);
      toast.success('Registration successful');
      
      // Check user role for proper redirection after registration
      if (response.user.role === 'superuser') {
        router.push('/superuser');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    try {
      setLoading(true);
      await authService.resetPassword(data);
      toast.success('Password reset successful');
      router.push('/login');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Password reset failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setLoading(true);
      await authService.requestPasswordReset(email);
      toast.success('Password reset email sent');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to send reset email');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (data: ConfirmResetData) => {
    try {
      setLoading(true);
      await authService.confirmReset(data);
      toast.success('Password reset confirmed');
      router.push('/login');
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to confirm reset');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isSuperuser,
    login,
    logout,
    register,
    resetPassword,
    requestPasswordReset,
    confirmReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 