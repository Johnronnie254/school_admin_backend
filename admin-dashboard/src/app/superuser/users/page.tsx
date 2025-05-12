'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superuserService } from '@/services/superuserService';
import { School } from '@/services/superuserService';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  PlusIcon,
  AcademicCapIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AdminForm from '@/components/forms/AdminForm';
import { Dialog } from '@/components/ui/dialog';

interface SchoolStats {
  admin_count: number;
  teacher_count: number;
  parent_count: number;
}

interface AdminData {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  role: string;
}

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const isSuperuser = localStorage.getItem('is_superuser') === 'true';
      
      if (!token || !isSuperuser) {
        router.push('/superuser/login');
        return false;
      }
      
      const testResult = await superuserService.testAuthCall();
      
      if (!testResult) {
        router.push('/superuser/login');
        return false;
      }
      
      setIsAuthenticated(true);
      return true;
    };
    
    checkAuth();
  }, [router]);

  // Fetch schools
  const { data: schools = [], isLoading: isLoadingSchools } = useQuery({
    queryKey: ['schools'],
    queryFn: superuserService.getSchools,
    enabled: isAuthenticated === true,
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Fetch school statistics for each school
  const { data: schoolStats = {} } = useQuery<Record<string, SchoolStats>>({
    queryKey: ['schoolStats'],
    queryFn: async () => {
      const stats: Record<string, SchoolStats> = {};
      for (const school of schools) {
        try {
          const schoolStat = await superuserService.getSchoolStats(school.id);
          stats[school.id] = schoolStat;
        } catch (error) {
          console.error(`Failed to fetch stats for school ${school.id}:`, error);
          stats[school.id] = {
            admin_count: 0,
            teacher_count: 0,
            parent_count: 0
          };
        }
      }
      return stats;
    },
    enabled: isAuthenticated === true && schools.length > 0,
    retry: 1
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: (data: { schoolId: string; adminData: AdminData }) =>
      superuserService.createAdminForSchool(data.schoolId, data.adminData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolStats'] });
      toast.success('Admin created successfully');
      setIsModalOpen(false);
      setSelectedSchool(null);
    },
    onError: () => {
      toast.error('Failed to create admin');
    },
  });

  const handleAddAdmin = (school: School) => {
    setSelectedSchool(school);
    setIsModalOpen(true);
  };

  const handleCreateAdmin = async (adminData: AdminData) => {
    if (!selectedSchool) return;
    createAdminMutation.mutate({
      schoolId: selectedSchool.id,
      adminData: { ...adminData, role: 'admin' }
    });
  };

  if (isAuthenticated === null || isLoadingSchools) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <div className="ml-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <UserGroupIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">School Users Management</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => {
          const stats = schoolStats[school.id];
          return (
            <div key={school.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-black">{school.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    school.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {school.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {/* Admins Section */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-black">Administrators</h3>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {stats?.admin_count || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddAdmin(school)}
                      className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-white border border-blue-200 rounded-md py-1.5 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Administrator
                    </button>
                  </div>

                  {/* Teachers Section */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AcademicCapIcon className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-black">Teachers</h3>
                      </div>
                      <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                        {stats?.teacher_count || 0}
                      </span>
                    </div>
                  </div>

                  {/* Parents Section */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-black">Parents</h3>
                      </div>
                      <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                        {stats?.parent_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Creation Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSchool(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-6 py-8 shadow-xl transition-all sm:w-full sm:max-w-2xl">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedSchool(null);
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="rounded-full bg-blue-50 p-2">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900">
                {selectedSchool ? `Add Administrator to ${selectedSchool.name}` : 'Add Administrator'}
              </Dialog.Title>
            </div>

            {selectedSchool && (
              <AdminForm
                onSubmit={handleCreateAdmin}
                onCancel={() => {
                  setIsModalOpen(false);
                  setSelectedSchool(null);
                }}
              />
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 