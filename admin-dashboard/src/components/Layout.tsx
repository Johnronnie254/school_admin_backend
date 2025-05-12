'use client';

import { ReactNode } from 'react';
import Sidebar from './layout/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex h-screen overflow-hidden">
        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6 px-4 sm:px-6 lg:px-8 mt-12 lg:mt-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 