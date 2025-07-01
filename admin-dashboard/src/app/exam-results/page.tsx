'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import examResultService, {type ExamPDF } from '@/services/examResultService';


export default function ExamResultsPage() {
  const [examPDFs, setExamPDFs] = useState<ExamPDF[]>([]);




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



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">Exam Results</h1>
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
    </div>
  );
}