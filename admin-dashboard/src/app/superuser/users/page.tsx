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
  TrashIcon,
  AcademicCapIcon,
  UserIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import AdminForm from '@/components/forms/AdminForm';

interface SchoolUsers {
  admins: any[];
  teachers: any[];
  parents: any[];
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
  const { data: schoolStats = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ['schoolStats'],
    queryFn: async () => {
      const stats: Record<string, any> = {};
      for (const school of schools) {
        try {
          const schoolStat = await superuserService.getSchoolStats(school.id);
          stats[school.id] = schoolStat;
        } catch (error) {
          console.error(`Failed to fetch stats for school ${school.id}:`, error);
          stats[school.id] = null;
        }
      }
      return stats;
    },
    enabled: isAuthenticated === true && schools.length > 0,
    retry: 1
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: (data: { schoolId: string; adminData: any }) =>
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

  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: (userId: string) => superuserService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolStats'] });
      toast.success('Admin deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete admin');
    },
  });

  const handleAddAdmin = (school: School) => {
    setSelectedSchool(school);
    setIsModalOpen(true);
  };

  const handleCreateAdmin = async (adminData: any) => {
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
            <div key={school.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{school.name}</h2>
                
                <div className="space-y-4">
                  {/* Admins Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium">Administrators</h3>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {stats?.admin_count || 0}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddAdmin(school)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Administrator
                    </button>
                  </div>

                  {/* Teachers Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AcademicCapIcon className="h-5 w-5 text-green-600" />
                        <h3 className="font-medium">Teachers</h3>
                      </div>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        {stats?.teacher_count || 0}
                      </span>
                    </div>
                  </div>

                  {/* Parents Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-purple-600" />
                        <h3 className="font-medium">Parents</h3>
                      </div>
                      <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
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
      {isModalOpen && selectedSchool && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-lg font-medium mb-4">
              Add Administrator to {selectedSchool.name}
            </h2>
            <AdminForm
              onSubmit={handleCreateAdmin}
              onCancel={() => {
                setIsModalOpen(false);
                setSelectedSchool(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 