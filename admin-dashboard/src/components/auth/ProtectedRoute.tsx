'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardLayout from '../layout/DashboardLayout';

const publicPaths = ['/login', '/register', '/forgot-password', '/'];

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('🔒 Checking authentication in ProtectedRoute');
    console.log('📍 Current path:', pathname);

    // Skip check for superuser routes - these are handled by their own middleware
    if (pathname.startsWith('/superuser')) {
      console.log('🔑 Superuser path detected, skipping regular auth check');
      return;
    }

    const token = localStorage.getItem('access_token');
    console.log('🎫 Token exists:', !!token);
    const isPublicPath = publicPaths.includes(pathname);
    console.log('🌐 Is public path:', isPublicPath);

    if (!token && !isPublicPath) {
      console.log('❌ No token found, redirecting to login');
      router.push('/login');
    } else if (token && isPublicPath && pathname !== '/') {
      // Only redirect to dashboard if on a public path that's not the landing page
      console.log('✅ Token found on public path, redirecting to dashboard');
      router.push('/dashboard');
    } else {
      console.log('✅ Authentication check passed');
    }
  }, [pathname, router]);

  // Don't wrap public routes, landing page, or superuser routes in the dashboard layout
  if (publicPaths.includes(pathname) || pathname.startsWith('/superuser')) {
    return <>{children}</>;
  }

  // For protected routes, wrap in the dashboard layout
  return <DashboardLayout>{children}</DashboardLayout>;
} 