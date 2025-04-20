'use client';

import { useQuery } from '@tanstack/react-query';
import { schoolService } from '@/services/api';
import {
  AcademicCapIcon,
  UserGroupIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: schoolStats, isLoading } = useQuery({
    queryKey: ['schoolStats'],
    queryFn: () => schoolService.getStatistics('current'),
  });

  const stats = [
    {
      name: 'Total Schools',
      value: schoolStats?.total_schools || 0,
      icon: AcademicCapIcon,
      href: '/schools',
      color: 'bg-blue-500',
    },
    {
      name: 'Total Teachers',
      value: schoolStats?.total_teachers || 0,
      icon: UserGroupIcon,
      href: '/teachers',
      color: 'bg-green-500',
    },
    {
      name: 'Total Students',
      value: schoolStats?.total_students || 0,
      icon: UsersIcon,
      href: '/students',
      color: 'bg-purple-500',
    },
    {
      name: 'Total Parents',
      value: schoolStats?.total_parents || 0,
      icon: UsersIcon,
      href: '/parents',
      color: 'bg-yellow-500',
    },
    {
      name: 'Fee Collection',
      value: schoolStats?.fee_collection || 0,
      icon: CurrencyDollarIcon,
      href: '/school-fees',
      color: 'bg-red-500',
      prefix: '$',
    },
    {
      name: 'Active Users',
      value: schoolStats?.active_users || 0,
      icon: ChartBarIcon,
      href: '#',
      color: 'bg-indigo-500',
    },
  ];

  const quickActions = [
    {
      name: 'Add School',
      href: '/schools?action=add',
      icon: AcademicCapIcon,
      description: 'Register a new school in the system',
    },
    {
      name: 'Add Teacher',
      href: '/teachers?action=add',
      icon: UserGroupIcon,
      description: 'Add a new teacher to a school',
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
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white overflow-hidden shadow rounded-lg h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon
                    className={`h-6 w-6 text-white ${stat.color} rounded-full p-1`}
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.prefix}
                        {stat.value.toLocaleString()}
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
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span
                  className={`rounded-lg inline-flex p-3 ring-4 ring-white ${
                    stats.find((s) => s.name.includes(action.name.split(' ')[1]))
                      ?.color || 'bg-blue-500'
                  }`}
                >
                  <action.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        <div className="mt-4 bg-white shadow rounded-lg">
          {/* Add recent activity content here */}
        </div>
      </div>
    </div>
  );
}