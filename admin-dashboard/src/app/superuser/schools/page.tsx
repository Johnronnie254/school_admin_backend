'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superuserService } from '@/services/superuserService';
import { School } from '@/types/school';
import { CreateSchoolDto } from '@/types/school';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  BuildingLibraryIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import SchoolForm from '@/components/forms/SchoolForm';

export default function SchoolsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
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
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: superuserService.getSchools,
    enabled: isAuthenticated === true,
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Create school mutation
  const createMutation = useMutation({
    mutationFn: superuserService.createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School created successfully');
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to create school');
    },
  });

  // Update school mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<School> }) =>
      superuserService.updateSchool(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School updated successfully');
      setEditingSchool(null);
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to update school');
    },
  });
  
  // Toggle school status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: number) => superuserService.toggleSchoolStatus(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success(data.message);
    },
    onError: () => {
      toast.error('Failed to toggle school status');
    },
  });

  // Delete school mutation
  const deleteMutation = useMutation({
    mutationFn: superuserService.deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete school');
    },
  });

  const handleAddSchool = () => {
    setEditingSchool(null);
    setIsModalOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
    setIsModalOpen(true);
  };
  
  const handleToggleStatus = (schoolId: number) => {
    if (window.confirm('Are you sure you want to change this school\'s status? This will affect login access for all users.')) {
      toggleStatusMutation.mutate(schoolId);
    }
  };

  const handleDeleteSchool = async (schoolId: number) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      deleteMutation.mutate(schoolId);
    }
  };

  const handleSubmit = async (data: Partial<School>) => {
    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, data });
    } else {
      createMutation.mutate(data as CreateSchoolDto);
    }
  };

  if (isAuthenticated === null || isLoading || toggleStatusMutation.isPending) {
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
          <BuildingLibraryIcon className="h-6 w-6 text-black" />
          <h1 className="text-2xl font-bold text-black">School Management</h1>
        </div>
        <button
          onClick={handleAddSchool}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add School
        </button>
      </div>

      {schools.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BuildingLibraryIcon className="mx-auto h-12 w-12 text-black" />
          <h3 className="mt-2 text-sm font-bold text-black">No schools</h3>
          <p className="mt-1 text-sm text-black">Get started by adding a new school.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                  School Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-black">{school.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-black">{school.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-black">{school.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button 
                        onClick={() => handleToggleStatus(school.id)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 items-center rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          school.is_active ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        <span className="sr-only">Toggle status</span>
                        <span
                          className={`${
                            school.is_active ? 'translate-x-5' : 'translate-x-1'
                          } inline-block h-4 w-4 rounded-full bg-white transform transition duration-200 ease-in-out`}
                        />
                      </button>
                      <span className={`ml-3 text-xs font-semibold ${
                        school.is_active ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {school.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditSchool(school)}
                      className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchool(school.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* School Form Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="relative transform overflow-hidden rounded-lg bg-white px-6 py-8 shadow-xl transition-all sm:w-full sm:max-w-2xl mx-4">
              <div className="absolute right-4 top-4">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSchool(null);
                  }}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="rounded-full bg-blue-50 p-2">
                  <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold leading-6 text-gray-900">
                  {editingSchool ? 'Edit School' : 'Add New School'}
                </h2>
              </div>

              <SchoolForm
                initialData={editingSchool}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsModalOpen(false);
                  setEditingSchool(null);
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
} 