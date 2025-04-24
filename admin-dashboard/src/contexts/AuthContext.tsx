'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const { access, refresh } = response.data;

      // Store tokens consistently
      localStorage.setItem('token', access); // Store as 'token' for the API client
      localStorage.setItem('accessToken', access); // Keep for backward compatibility
      localStorage.setItem('refreshToken', refresh);

      // Create user info from response
      const userInfo = {
        id: response.data.id,
        name: response.data.name || email,
        email: email,
        role: response.data.role || 'admin'
      };

      // Verify if user is an admin
      if (userInfo.role !== 'admin') {
        throw new Error('Access denied. This portal is for administrators only.');
      }

      // Store user info
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);

      router.push('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An error occurred during login');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all stored tokens
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 