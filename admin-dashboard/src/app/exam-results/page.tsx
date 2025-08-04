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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-soft backdrop-blur-sm">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Exam Results</h1>
            <p className="text-sm text-gray-600 mt-1">View and download uploaded exam papers</p>
          </div>
        </div>
      </div>

      {/* Uploaded Exam PDFs Section */}
      <div>        
        {examPDFs.length > 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border border-blue-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100/50">
                <thead className="bg-gradient-to-r from-blue-50/80 to-blue-100/60 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Exam Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Teacher</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-blue-100/30">
                  {examPDFs.map((exam) => (
                    <tr key={exam.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{exam.exam_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{exam.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{exam.class_assigned}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{exam.teacher_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(exam.exam_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDownloadPDF(exam.id, `${exam.exam_name}-${exam.subject}.pdf`)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-soft backdrop-blur-sm transition-all duration-200"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 shadow-soft backdrop-blur-sm border border-blue-200/20 max-w-md mx-auto">
              <AcademicCapIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-600 mb-2">No Exam Papers Yet</h3>
              <p className="text-sm text-gray-600 mb-2">No exam result PDFs have been uploaded yet.</p>
              <p className="text-xs text-gray-500">Exam result PDFs uploaded by teachers will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}