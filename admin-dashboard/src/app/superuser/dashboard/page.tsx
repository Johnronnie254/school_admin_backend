'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superuserService } from '@/services/superuserService';
import { School } from '@/services/superuserService';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  BuildingLibraryIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import SchoolForm from '@/components/forms/SchoolForm';

export default function SuperuserDashboard() {
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
      
      console.log('🔒 Dashboard checking auth - token exists:', !!token);
      console.log('🔒 Dashboard checking auth - is superuser:', isSuperuser);
      
      if (!token || !isSuperuser) {
        console.log('❌ Dashboard detected missing credentials, redirecting to login');
        router.push('/superuser/login');
        return false;
      }
      
      // Verify API connection works with current token
      console.log('🔍 Testing API auth before proceeding');
      const testResult = await superuserService.testAuthCall();
      
      if (!testResult) {
        console.log('❌ API auth test failed, redirecting to login for new token');
        router.push('/superuser/login');
        return false;
      }
      
      console.log('✅ Dashboard authenticated, proceeding with data fetch');
      setIsAuthenticated(true);
      return true;
    };
    
    // Run auth check on component mount
    checkAuth();
    
    // Add event listener for storage changes (in case tokens are cleared elsewhere)
    const handleStorageChange = () => {
      const token = localStorage.getItem('access_token');
      const isSuperuser = localStorage.getItem('is_superuser') === 'true';
      
      if (!token || !isSuperuser) {
        console.log('🔒 Storage change detected - auth lost, redirecting');
        window.location.href = '/superuser/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  // Fetch schools, but only if authenticated
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: superuserService.getSchools,
    enabled: isAuthenticated === true, // Only run query if authenticated
    retry: 1, // Limit retries to avoid loops
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false // Prevent auto refresh on window focus
  });

  // Handle query errors separately via useEffect
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('Authentication verified, checking if data fetch was successful');
      // Only redirect if we're already authenticated but have no access token
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('Token missing after query attempt, redirecting to login');
        router.push('/superuser/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

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
    mutationFn: ({ id, data }: { id: string; data: Partial<School> }) =>
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

  const handleSubmit = async (data: Partial<School>) => {
    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <div className="ml-4">Checking authentication...</div>
      </div>
    );
  }

  // Show loading state for data
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <div className="ml-4">Loading schools...</div>
      </div>
    );
  }

  const schoolsData = schools as School[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <BuildingLibraryIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">School Management</h1>
        </div>
        <button
          onClick={handleAddSchool}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add School
        </button>
      </div>

      {schoolsData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BuildingLibraryIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No schools</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new school.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schoolsData.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{school.name}</div>
                    <div className="text-sm text-gray-500">{school.registration_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{school.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{school.phone_number}</div>
                    <div className="text-sm text-gray-500">{school.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        school.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {school.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditSchool(school)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this school?')) {
                            deleteMutation.mutate(school.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* School Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-lg font-medium mb-4">
              {editingSchool ? 'Edit School' : 'Add New School'}
            </h2>
            <SchoolForm 
              school={editingSchool}
              onSubmit={handleSubmit}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
} 