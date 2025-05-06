'use client';

import SuperuserHeader from '@/components/layout/SuperuserHeader';
import SuperuserRoute from '@/components/auth/SuperuserRoute';

export default function SuperuserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperuserRoute>
      <div className="min-h-screen bg-gray-50">
        <SuperuserHeader />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </SuperuserRoute>
  );
} 