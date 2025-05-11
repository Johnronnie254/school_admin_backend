'use client';

import { useQuery } from '@tanstack/react-query';
import { superuserService } from '@/services/superuserService';
import {
  BuildingLibraryIcon,
  UsersIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function SuperuserPage() {
  // Fetch superuser dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['superuser-stats'],
    queryFn: superuserService.getDashboardStats,
    staleTime: 60000, // 1 minute
  });

  const statCards = [
    {
      name: 'Total Schools',
      value: stats?.school_count || 0,
      icon: BuildingLibraryIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Total Users',
      value: stats?.users_count || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Teachers',
      value: stats?.teachers_count || 0,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Students',
      value: stats?.students_count || 0,
      icon: UserGroupIcon,
      color: 'bg-yellow-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Superuser Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of all schools and system users</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon
                    className={`h-6 w-6 ${item.color} text-white rounded p-1`}
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {String(item.value)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Welcome to the Superuser Dashboard</h2>
        <p className="text-gray-600">
          As a superuser, you have access to manage all aspects of the system:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-600">
          <li>Create and manage schools</li>
          <li>Assign administrators to schools</li>
          <li>Monitor system-wide statistics</li>
          <li>Configure global settings</li>
        </ul>
        <p className="mt-4 text-gray-600">
          Use the navigation above to access different sections of the superuser portal.
        </p>
      </div>
    </>
  );
} 