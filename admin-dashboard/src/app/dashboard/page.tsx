'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { EventBanner } from '@/components/EventBanner';
import { InternetStatus } from '@/components/InternetStatus';
import { schoolService } from '@/services/schoolService';
import {
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardPage() {
  const { logout } = useAuth();
  

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
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Total Students',
      value: studentCount,
      icon: UsersIcon,
      href: '/students',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      name: 'Total Parents',
      value: parentCount,
      icon: UsersIcon,
      href: '/parents',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
    {
      name: 'Active Users',
      value: totalActiveUsers,
      icon: ChartBarIcon,
      href: '#',
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-700',
    },
  ];

  const quickActions = [
    {
      name: 'Add Teacher',
      href: '/teachers?action=add',
      icon: UserGroupIcon,
      description: 'Add a new teacher to your school',
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Add Student',
      href: '/students?action=add',
      icon: UsersIcon,
      description: 'Enroll a new student',
      color: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      name: 'Schedule Event',
      href: '/calendar?action=add',
      icon: CalendarIcon,
      description: 'Create a new school event',
      color: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div>
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-surface-200 rounded-lg w-48 mb-3"></div>
            <div className="h-4 bg-surface-200 rounded w-32"></div>
          </div>
          
          {/* Stats grid skeleton */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow-soft border border-surface-200/50"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-surface-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-surface-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-surface-200 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Navigation Bar with School Info */}
      {currentSchool && (
        <div className="bg-white/80 backdrop-blur-sm shadow-soft rounded-2xl p-6 mb-8 border border-gray-200/50">
          <div className="flex justify-between items-center">
            <div className="flex items-start space-x-0">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-soft mr-4">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div className="-mt-3">
                <h2 className="text-3xl font-bold text-blue-900 mb-1">{currentSchool.name}</h2>
                <p className="text-gray-600 font-medium">{currentSchool.registration_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {currentSchool.logo && (
                <div className="relative">
                  <Image
                    src={currentSchool.logo}
                    alt={`${currentSchool.name} logo`}
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain bg-white p-2 rounded-xl border border-gray-200 shadow-soft"
                  />
                </div>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl hover:bg-blue-100 hover:shadow-soft transition-all duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Banner */}
      <div className="mb-8">
        <EventBanner />
      </div>
      
      {/* Main Dashboard Content */}
      <div className="space-y-8">
        {/* Header */}
        <div className="-mt-3">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 font-medium">Welcome back! Here&apos;s what&apos;s happening at your school today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group bg-white rounded-2xl shadow-soft border border-surface-200/50 hover:shadow-medium transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 ${item.bgColor} rounded-xl`}>
                      <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{item.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{String(item.value)}</p>
                    </div>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex-1 bg-surface-100 rounded-full h-2 mr-3">
                    <div 
                      className={`bg-gradient-to-r ${item.color} h-2 rounded-full`}
                      style={{ width: `${Math.min((item.value / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-surface-500 font-medium">+12%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="group bg-white rounded-2xl shadow-soft border border-surface-200/50 hover:shadow-medium transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 ${action.color} rounded-xl flex-shrink-0`}>
                      <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors duration-200">
                        {action.name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>

                </div>
              </Link>

            ))}
          </div> <div className= "mb-7"></div>
        </div>
      </div>

      {/* Internet Status Indicator */}
      <InternetStatus />
    </div>
  );
}