'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type SubmitHandler } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import examResultService, { type ExamResult, type ExamResultFormData, type ExamPDF } from '@/services/examResultService';
import { Dialog } from '@/components/ui/dialog';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ExamResultsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ExamResult | null>(null);
  const queryClient = useQueryClient();
  const [examPDFs, setExamPDFs] = useState<ExamPDF[]>([]);


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

  // Use React Query for exam results
  const { data: examResults = [], isLoading, error: queryError } = useQuery({
    queryKey: ['examResults'],
    queryFn: async () => {
      try {
        const response = await examResultService.getExamResults();
        return response.results || [];
      } catch (error) {
        console.error('Failed to fetch exam results:', error);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
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

  // Fetch exam PDFs separately
  useEffect(() => {
    const fetchExamPDFs = async () => {
      try {
        const pdfsData = await examResultService.getExamPDFs();
        setExamPDFs(pdfsData);
      } catch (err) {
        console.error('Failed to fetch exam PDFs:', err);
        // Don't set error for PDFs as it's not critical
      }
    };

    fetchExamPDFs();
  }, []);

  const handleDownloadPDF = async (examId: string, fileName: string) => {
    try {
      const blob = await examResultService.downloadExamPDF(examId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('Failed to download PDF:', err);
      toast.error('Failed to download PDF');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">Exam Results</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Result
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={isLoading}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Download Results
          </button>
        </div>
      </div>

      {/* Uploaded Exam PDFs Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Uploaded Exam Papers</h2>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {examPDFs.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examPDFs.map((exam) => (
                  <tr key={exam.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.class_assigned}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.teacher_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(exam.exam_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDownloadPDF(exam.id, `${exam.exam_name}-${exam.subject}.pdf`)}
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No exam result pdfs have been uploaded yet.</p>
              <p className="text-sm text-gray-400 mt-1">Exam result pdfs uploaded by teachers will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Exam Results Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Student Results</h2>
        {queryError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-yellow-800">
              Unable to load exam results. Please check your connection or contact support.
            </p>
          </div>
        )}
        
        {examResults.length === 0 && !queryError ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No exam results</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new exam result.</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.student_name || result.student}
                    </td>
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
      </div>

      {/* Exam Result Form Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingResult(null);
          reset();
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative transform overflow-hidden bg-white rounded-lg px-6 py-8 shadow-xl transition-all w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingResult(null);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="rounded-full bg-blue-50 p-2">
                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
              </div>
              <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900">
                {editingResult ? 'Edit Exam Result' : 'Add New Exam Result'}
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Student ID
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      {...register('student', { required: 'Student ID is required' })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter student ID"
                    />
                    {errors.student && (
                      <p className="mt-2 text-sm text-red-600">{errors.student.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Exam Name
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      {...register('exam_name', { required: 'Exam name is required' })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter exam name"
                    />
                    {errors.exam_name && (
                      <p className="mt-2 text-sm text-red-600">{errors.exam_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subject
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      {...register('subject', { required: 'Subject is required' })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter subject"
                    />
                    {errors.subject && (
                      <p className="mt-2 text-sm text-red-600">{errors.subject.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Marks
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="number"
                      step="0.01"
                      {...register('marks', { 
                        required: 'Marks are required',
                        min: { value: 0, message: 'Marks must be greater than 0' },
                        max: { value: 100, message: 'Marks cannot exceed 100' }
                      })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter marks"
                    />
                    {errors.marks && (
                      <p className="mt-2 text-sm text-red-600">{errors.marks.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Grade
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <select
                      {...register('grade', { required: 'Grade is required' })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
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
                      <p className="mt-2 text-sm text-red-600">{errors.grade.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Term
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <select
                      {...register('term', { required: 'Term is required' })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    >
                      <option value="">Select Term</option>
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                    {errors.term && (
                      <p className="mt-2 text-sm text-red-600">{errors.term.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Year
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <input
                      type="number"
                      {...register('year', { 
                        required: 'Year is required',
                        min: { value: 2000, message: 'Invalid year' },
                        max: { value: new Date().getFullYear(), message: 'Year cannot be in the future' }
                      })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter year"
                    />
                    {errors.year && (
                      <p className="mt-2 text-sm text-red-600">{errors.year.message}</p>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Remarks
                  </label>
                  <div className="mt-2">
                    <textarea
                      {...register('remarks')}
                      rows={3}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter any remarks"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingResult(null);
                    reset();
                  }}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingResult ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    <>{editingResult ? 'Update Result' : 'Create Result'}</>
                  )}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 