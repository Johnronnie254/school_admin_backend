'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Teachers', href: '/teachers', icon: UserGroupIcon },
  { name: 'Students', href: '/students', icon: AcademicCapIcon },
  { name: 'Classes', href: '/classes', icon: ClipboardDocumentListIcon },
  { name: 'Schedule', href: '/schedule', icon: CalendarIcon },
  { name: 'Fees', href: '/fees', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user && pathname !== '/') {
    // Redirect to login if not authenticated
    window.location.href = '/';
    return null;
  }

  return <>{children}</>;
};

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Don't show sidebar on landing page
  if (pathname === '/') {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <img className="w-auto h-8" src="/logo.png" alt="School Admin" />
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            {user && (
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div>
                    <img
                      className="inline-block h-9 w-9 rounded-full"
                      src={user.avatar || 'https://via.placeholder.com/40'}
                      alt={user.name}
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{user.name}</p>
                    <button
                      onClick={() => logout()}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1">
          <main className="flex-1 pb-8">
            {/* Page header */}
            <div className="bg-white shadow">
              <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
                <div className="py-6 md:flex md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Page title */}
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                      {navigation.find((item) => item.href === pathname)?.name || 'School Admin'}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProtectedRoute>
          <LayoutContent>{children}</LayoutContent>
        </ProtectedRoute>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
} 