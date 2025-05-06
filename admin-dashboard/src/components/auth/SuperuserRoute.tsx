'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SuperuserRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function SuperuserRoute({
  children,
  fallback = <div>You do not have permission to access this page.</div>,
}: SuperuserRouteProps) {
  const router = useRouter();
  const { user, loading, isSuperuser } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      // If not loading anymore, we can make a decision
      if (!user) {
        // Not logged in, redirect to superuser login
        router.push('/superuser/login');
      } else if (!isSuperuser) {
        // Not a superuser, do not redirect but show fallback
        setIsChecking(false);
      } else {
        // Is a superuser, show content
        setIsChecking(false);
      }
    }
  }, [loading, user, isSuperuser, router]);

  if (loading || isChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we're here, we're not loading and we've completed our checks
  return <>{isSuperuser ? children : fallback}</>;
} 