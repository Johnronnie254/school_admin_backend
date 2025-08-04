'use client';

import { ReactNode } from 'react';
import Sidebar from './layout/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar />
      <div className="flex h-screen overflow-hidden">
        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden lg:ml-72">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-8 px-6 sm:px-8 lg:px-10 mt-12 lg:mt-0">
              <div className="animate-fade-in">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 