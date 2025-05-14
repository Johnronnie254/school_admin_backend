'use client';

import { useQuery } from '@tanstack/react-query';
import { teacherService, Teacher } from '@/services/teacherService';
import { studentService, Student } from '@/services/studentService';
import { parentService, Parent } from '@/services/parentService';
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
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DashboardPage() {
  const { logout } = useAuth();
  const isOnline = useOnlineStatus();
  
  const { data: teachersData, isLoading: isLoadingTeachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      try {
        const response = await teacherService.getTeachers();
        // Always return an array, even if the response is malformed
        return Array.isArray(response?.results) ? response.results : [];
      } catch (error) {
        console.error('Error fetching teachers in dashboard:', error);
        return [];
      }
    },
  });

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      try {
        const response = await studentService.getStudents();
        // Always return an array, even if the response is malformed
        return Array.isArray(response?.results) ? response.results : [];
      } catch (error) {
        console.error('Error fetching students in dashboard:', error);
        return [];
      }
    },
  });

  const { data: parentsData, isLoading: isLoadingParents } = useQuery<Parent[]>({
    queryKey: ['parents'],
    queryFn: async () => {
      try {
        const response = await parentService.getParents();
        // Always return an array, even if the response is malformed
        return Array.isArray(response?.results) ? response.results : [];
      } catch (error) {
        console.error('Error fetching parents in dashboard:', error);
        return [];
      }
    },
  });

  const isLoading = isLoadingTeachers || isLoadingStudents || isLoadingParents;
  const teachers = teachersData || [];
  const students = studentsData || [];
  const parents = parentsData || [];

  // Safe count function that converts NaN or undefined to 0
  const safeCount = (arr: Array<unknown> | undefined | null): number => Array.isArray(arr) ? arr.length : 0;
  const teacherCount = safeCount(teachers);
  const studentCount = safeCount(students);
  const parentCount = safeCount(parents);
  const totalActiveUsers = teacherCount + studentCount + parentCount;

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
    // {
    //   name: 'Fee Collection',
    //   value: schoolStats?.fee_collection || 0,
    //   icon: CurrencyDollarIcon,
    //   href: '/school-fees',
    //   color: 'bg-red-500',
    //   prefix: '$',
    // },
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