'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from '@/contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  AcademicCapIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

// Define public routes that should not have the sidebar
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password'];

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Teachers', href: '/teachers', icon: UserGroupIcon },
  { name: 'Students', href: '/students', icon: UsersIcon },
  { name: 'Classes', href: '/classes', icon: AcademicCapIcon },
  { name: 'Schedule', href: '/schedule', icon: CalendarIcon },
  { name: 'Fees', href: '/fees', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <span className="text-xl font-semibold text-gray-900">School Admin</span>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-md
                      ${isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-6 w-6 flex-shrink-0
                        ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
      <main className="lg:pl-72 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isPublicRoute ? (
          <div className="min-h-screen">
            {children}
            <Toaster position="top-right" />
          </div>
        ) : (
          <>
            <LayoutContent>{children}</LayoutContent>
            <Toaster position="top-right" />
          </>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
} 