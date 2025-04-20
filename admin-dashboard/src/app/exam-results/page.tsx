'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  XMarkIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';
import { examResultService, type ExamResult, type ExamResultFormData } from '@/services/examResultService';

export default function ExamResultsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ExamResult | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExamResultFormData>({
    defaultValues: editingResult ? {
      student: editingResult.student,
      exam_name: editingResult.exam_name,
      subject: editingResult.subject,
      marks: editingResult.marks,
      grade: editingResult.grade,
      term: editingResult.term,
      year: editingResult.year,
      remarks: editingResult.remarks
    } : {}
  });

  const { data: examResults = [], isLoading } = useQuery<ExamResult[]>({
    queryKey: ['examResults'],
    queryFn: examResultService.getExamResults
  });

  const createMutation = useMutation({
    mutationFn: examResultService.createExamResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examResults'] });
      setIsModalOpen(false);
      reset();
      toast.success('Exam result created successfully');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to create exam result');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExamResultFormData> }) =>
      examResultService.updateExamResult(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examResults'] });
      setIsModalOpen(false);
      setEditingResult(null);
      reset();
      toast.success('Exam result updated successfully');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to update exam result');
      }
    }
  });

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

  const onSubmit: SubmitHandler<ExamResultFormData> = (data) => {
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
      toast.success('Download started');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to download exam results');
      } else {
        toast.error('Failed to download exam results');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">Exam Results</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={isLoading}
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
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <PlusIcon className="h-5 w-5" />
            Add Result
          </button>
        </div>
      </div>

      {isLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : examResults.length === 0 ? (
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No exam results</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new exam result.</p>
        </div>
      ) : (
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
      )}

      {/* Exam Result Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl w-full max-w-2xl shadow-2xl relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingResult(null);
                reset();
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {editingResult ? 'Edit Exam Result' : 'Add New Exam Result'}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('student', { required: 'Student ID is required' })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter student ID"
                  />
                  {errors.student && (
                    <p className="mt-1 text-sm text-red-600">{errors.student.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('exam_name', { required: 'Exam name is required' })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter exam name"
                  />
                  {errors.exam_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.exam_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('subject', { required: 'Subject is required' })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter subject"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      {...register('marks', { 
                        required: 'Marks are required',
                        min: { value: 0, message: 'Marks must be greater than 0' },
                        max: { value: 100, message: 'Marks cannot exceed 100' }
                      })}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter marks"
                    />
                    <div className="absolute right-2 top-2 group">
                      <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
                      <div className="hidden group-hover:block absolute right-0 top-6 bg-gray-800 text-white text-xs rounded p-2 w-48">
                        Enter marks between 0 and 100
                      </div>
                    </div>
                  </div>
                  {errors.marks && (
                    <p className="mt-1 text-sm text-red-600">{errors.marks.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    {...register('grade', { required: 'Grade is required' })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    {...register('term', { required: 'Term is required' })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('year', { 
                      required: 'Year is required',
                      min: { value: 2000, message: 'Invalid year' },
                      max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' }
                    })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter year"
                  />
                  {errors.year && (
                    <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    {...register('remarks')}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter any remarks"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingResult(null);
                    reset();
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingResult ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{editingResult ? 'Update Result' : 'Create Result'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 