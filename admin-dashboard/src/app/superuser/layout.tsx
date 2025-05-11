'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BuildingLibraryIcon,
  HomeIcon,
  AcademicCapIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function SuperuserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip check if we're on the login page
    if (pathname === '/superuser/login') {
      console.log('✅ On superuser login page, not checking auth');
      setIsLoading(false);
      return;
    }

    console.log('🔒 Checking superuser authentication in layout');
    
    // Check if user is authenticated properly
    const user = localStorage.getItem('user');
    const isSuperuserLS = localStorage.getItem('is_superuser') === 'true';
    const token = localStorage.getItem('access_token');
    
    console.log('👤 Superuser in localStorage:', isSuperuserLS);
    console.log('👤 User in localStorage exists:', !!user);
    console.log('🔑 Token exists:', !!token);

    if (!user || !isSuperuserLS || !token) {
      console.log('❌ Not authenticated as superuser, redirecting to login');
      router.push('/superuser/login');
    } else {
      console.log('✅ Superuser authenticated');
      setIsSuperuser(true);
    }
    setIsLoading(false);
  }, [router, pathname]);

  const handleLogout = () => {
    console.log('🚪 Logging out superuser');
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('is_superuser');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Also remove cookies
    document.cookie = 'is_superuser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    router.push('/superuser/login');
  };

  // If we're on the login page, just render the children (the login page)
  if (pathname === '/superuser/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isSuperuser) {
    return null;
  }

  return (
    

<div className="min-h-screen bg-gray-100">
  {/* Navigation */}
  <nav className="bg-white shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/superuser" className="flex items-center gap-2">
              <BuildingLibraryIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Superuser Portal</span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            <Link
              href="/superuser"
              className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                pathname === '/superuser'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } text-sm font-medium`}
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Dashboard
            </Link>
            <Link
              href="/superuser/schools"
              className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                pathname === '/superuser/schools'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } text-sm font-medium`}
            >
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Schools
            </Link>
            <Link
              href="/superuser/users"
              className={`inline-flex items-center px-1 pt-1 border-b-2 ${
                pathname === '/superuser/users'
                  ? 'border-blue-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } text-sm font-medium`}
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Users
            </Link>
          </div>
        </div>
        <div className="hidden sm:ml-6 sm:flex sm:items-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>

  {/* Main Content */}
  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    {children}
  </main>
</div>
  );
}