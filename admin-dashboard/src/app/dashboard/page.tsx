'use client';

import { useQuery } from '@tanstack/react-query';
import { schoolService } from '@/services/schoolService';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { EventBanner } from '@/components/EventBanner';
import { InternetStatus } from '@/components/InternetStatus';
import {
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DashboardPage() {
  const { logout } = useAuth();
  const isOnline = useOnlineStatus();
  
  // Fetch school statistics instead of individual counts
  const { data: schoolStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['schoolStatistics'],
    queryFn: schoolService.getSchoolStatistics,
  });
  
  // Fetch current school information for the banner
  const { data: currentSchool, isLoading: isLoadingSchool } = useQuery({
    queryKey: ['currentSchool'],
    queryFn: schoolService.getCurrentSchool,
  });

  const isLoading = isLoadingStats || isLoadingSchool;

  // Use school-specific counts from the statistics
  const teacherCount = schoolStats?.total_teachers || 0;
  const studentCount = schoolStats?.total_students || 0;
  const parentCount = schoolStats?.total_parents || 0;
  const totalActiveUsers = schoolStats?.active_users || 0;

  const stats = [
    {
      name: 'Total Teachers',
      value: teacherCount,
      icon: UserGroupIcon,
      href: '/teachers',
      color: 'bg-green-500',
    },
    {
      name: 'Total Students',
      value: studentCount,
      icon: UsersIcon,
      href: '/students',
      color: 'bg-purple-500',
    },
    {
      name: 'Total Parents',
      value: parentCount,
      icon: UsersIcon,
      href: '/parents',
      color: 'bg-yellow-500',
    },
    {
      name: 'Active Users',
      value: totalActiveUsers,
      icon: ChartBarIcon,
      href: '#',
      color: 'bg-indigo-500',
    },
  ];

  const quickActions = [
    {
      name: 'Add Teacher',
      href: '/teachers?action=add',
      icon: UserGroupIcon,
      description: 'Add a new teacher to your school',
    },
    {
      name: 'Add Student',
      href: '/students?action=add',
      icon: UsersIcon,
      description: 'Enroll a new student',
    },
    {
      name: 'Schedule Event',
      href: '/calendar?action=add',
      icon: CalendarIcon,
      description: 'Create a new school event',
    },
  ];

  if (isLoading) {
    return (
      <div className="animate-pulse p-4">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white overflow-hidden shadow rounded-lg h-24 sm:h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      {/* Event Banner */}
      {isOnline && <EventBanner />}
      
      {/* School Banner */}
      {currentSchool && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-6 rounded-lg shadow-lg mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <AcademicCapIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white mr-3" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{currentSchool.name}</h2>
                <p className="text-sm sm:text-base text-blue-100">{currentSchool.registration_number}</p>
              </div>
            </div>
            {currentSchool.logo && (
              <img 
                src={currentSchool.logo} 
                alt={`${currentSchool.name} logo`} 
                className="h-12 w-12 sm:h-16 sm:w-16 object-contain bg-white p-1 rounded-full"
              />
            )}
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">School Administration</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto justify-center sm:justify-start"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <item.icon
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color} text-white rounded p-1`}
                    />
                  </div>
                  <div className="ml-4 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-xl sm:text-2xl font-semibold text-gray-900">
                          {String(item.value)}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-medium text-gray-900 mt-6 sm:mt-8 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      {action.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Internet Status Indicator */}
      <InternetStatus />
    </div>
  );
}