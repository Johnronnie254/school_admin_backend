'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi, type BulkPromoteStudentsData } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function PromoteStudentsPage() {
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch students by grade
  const { data: students, isLoading } = useQuery({
    queryKey: ['students', selectedGrade],
    queryFn: async () => {
      // You'll need to add this endpoint to your API
      const response = await fetch(`/api/students/by-grade/${selectedGrade}`);
      return response.json();
    },
  });

  // Bulk promote students mutation
  const promoteMutation = useMutation({
    mutationFn: (data: BulkPromoteStudentsData) => adminApi.bulkPromoteStudents(data),
    onSuccess: () => {
      toast.success('Students promoted successfully');
      setSelectedStudents([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to promote students');
    },
  });

  const handlePromote = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select students to promote');
      return;
    }

    promoteMutation.mutate({
      grade: selectedGrade,
      students: selectedStudents,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Promote Students</h1>
          <p className="mt-2 text-sm text-gray-700">
            Select students to promote to the next grade level.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handlePromote}
            disabled={promoteMutation.isPending || selectedStudents.length === 0}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <ArrowUpIcon className="h-5 w-5 inline-block mr-2" />
            Promote Selected Students
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
          Select Grade
        </label>
        <select
          id="grade"
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
            <option key={grade} value={grade}>
              Grade {grade}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={students?.length > 0 && selectedStudents.length === students.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(students.map((student: any) => student.id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </th>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Current Grade
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Class
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Guardian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students?.map((student: any) => (
                  <tr key={student.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                          }
                        }}
                      />
                    </td>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {student.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      Grade {student.grade}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {student.class_assigned}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {student.guardian}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedStudents.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5">
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-indigo-600 p-2 shadow-lg sm:p-3">
              <div className="flex flex-wrap items-center justify-between">
                <div className="flex w-0 flex-1 items-center">
                  <span className="flex rounded-lg bg-indigo-800 p-2">
                    <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                  <p className="ml-3 font-medium text-white truncate">
                    <span className="md:hidden">
                      {selectedStudents.length} students selected
                    </span>
                    <span className="hidden md:inline">
                      {selectedStudents.length} students selected for promotion
                    </span>
                  </p>
                </div>
                <div className="mt-0 w-auto flex-shrink-0 sm:mt-0 sm:ml-3">
                  <button
                    type="button"
                    onClick={handlePromote}
                    disabled={promoteMutation.isPending}
                    className="block rounded-md bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white shadow hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    {promoteMutation.isPending ? 'Promoting...' : 'Promote Selected'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 