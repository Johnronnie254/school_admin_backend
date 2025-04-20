'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { examResultService, type ExamResult, type ExamResultFormData } from '@/services/examResultService';

export default function ExamResultsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ExamResult | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExamResultFormData>();

  // Fetch exam results
  const { data: examResults = [], isLoading } = useQuery({
    queryKey: ['examResults'],
    queryFn: examResultService.getExamResults
  });

  // Create exam result mutation
  const createMutation = useMutation({
    mutationFn: examResultService.createExamResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examResults'] });
      toast.success('Exam result created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to create exam result');
      }
    }
  });

  // Update exam result mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExamResultFormData> }) =>
      examResultService.updateExamResult(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examResults'] });
      toast.success('Exam result updated successfully');
      setIsModalOpen(false);
      setEditingResult(null);
      reset();
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to update exam result');
      }
    }
  });

  // Delete exam result mutation
  const deleteMutation = useMutation({
    mutationFn: examResultService.deleteExamResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examResults'] });
      toast.success('Exam result deleted successfully');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to delete exam result');
      }
    }
  });

  const onSubmit = (data: ExamResultFormData) => {
    if (editingResult) {
      updateMutation.mutate({ id: editingResult.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (result: ExamResult) => {
    setEditingResult(result);
    reset({
      student: result.student,
      exam_name: result.exam_name,
      subject: result.subject,
      marks: result.marks,
      grade: result.grade,
      term: result.term,
      year: result.year,
      remarks: result.remarks
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exam result?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await examResultService.downloadResults();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exam_results.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download exam results');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download Results
          </button>
          <button
            onClick={() => {
              setEditingResult(null);
              reset();
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            Add Result
          </button>
        </div>
      </div>

      {/* Exam Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {examResults.map((result: ExamResult) => (
              <tr key={result.id}>
                <td className="px-6 py-4 whitespace-nowrap">{result.student}</td>
                <td className="px-6 py-4 whitespace-nowrap">{result.exam_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{result.subject}</td>
                <td className="px-6 py-4 whitespace-nowrap">{result.marks}</td>
                <td className="px-6 py-4 whitespace-nowrap">{result.grade}</td>
                <td className="px-6 py-4 whitespace-nowrap">{result.term}</td>
                <td className="px-6 py-4 whitespace-nowrap">{result.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEdit(result)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(result.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exam Result Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingResult ? 'Edit Exam Result' : 'Add New Exam Result'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID</label>
                <input
                  type="text"
                  {...register('student', { required: 'Student ID is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.student && (
                  <p className="mt-1 text-sm text-red-600">{errors.student.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Exam Name</label>
                <input
                  type="text"
                  {...register('exam_name', { required: 'Exam name is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.exam_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.exam_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  {...register('subject', { required: 'Subject is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Marks</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('marks', { 
                    required: 'Marks are required',
                    min: { value: 0, message: 'Marks must be greater than 0' },
                    max: { value: 100, message: 'Marks cannot exceed 100' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.marks && (
                  <p className="mt-1 text-sm text-red-600">{errors.marks.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Grade</label>
                <select
                  {...register('grade', { required: 'Grade is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Grade</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                </select>
                {errors.grade && (
                  <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Term</label>
                <select
                  {...register('term', { required: 'Term is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Term</option>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
                {errors.term && (
                  <p className="mt-1 text-sm text-red-600">{errors.term.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  {...register('year', { 
                    required: 'Year is required',
                    min: { value: 2000, message: 'Invalid year' },
                    max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  {...register('remarks')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingResult(null);
                    reset();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {editingResult ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 