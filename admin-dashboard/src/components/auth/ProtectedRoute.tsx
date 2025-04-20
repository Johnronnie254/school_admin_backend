'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardLayout from '../layout/DashboardLayout';

const publicPaths = ['/login', '/register', '/forgot-password'];

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const isPublicPath = publicPaths.includes(pathname);

    if (!token && !isPublicPath) {
      router.push('/login');
    } else if (token && isPublicPath) {
      router.push('/dashboard');
    }
  }, [pathname, router]);

  // Don't wrap public routes in the dashboard layout
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // For protected routes, wrap in the dashboard layout
  return <DashboardLayout>{children}</DashboardLayout>;
} 