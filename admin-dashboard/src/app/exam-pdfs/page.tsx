'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DocumentIcon, ArrowDownTrayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { examPdfService, ExamPDF } from '@/services/examPdfService';
import toast from 'react-hot-toast';

export default function ExamPDFsPage() {
  const [selectedPdf, setSelectedPdf] = useState<ExamPDF | null>(null);

  const { data: examPdfs, isLoading } = useQuery({
    queryKey: ['exam-pdfs'],
    queryFn: examPdfService.getExamPdfs,
  });

  const handleDownload = async (pdf: ExamPDF) => {
    try {
      const blob = await examPdfService.downloadPdf(pdf.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pdf.exam_name}-${pdf.subject}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleApprove = async (pdf: ExamPDF) => {
    try {
      await examPdfService.approvePdf(pdf.id);
      toast.success('PDF approved successfully');
    } catch (error) {
      console.error('Error approving PDF:', error);
      toast.error('Failed to approve PDF');
    }
  };

  const handleReject = async (pdf: ExamPDF, remarks: string) => {
    try {
      await examPdfService.rejectPdf(pdf.id, remarks);
      toast.success('PDF rejected successfully');
    } catch (error) {
      console.error('Error rejecting PDF:', error);
      toast.error('Failed to reject PDF');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-full bg-blue-50 p-1.5 sm:p-2">
            <DocumentIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Exam PDFs</h1>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examPdfs?.map((pdf) => (
                  <tr key={pdf.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pdf.exam_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pdf.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pdf.class_assigned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pdf.teacher_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(pdf.exam_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pdf.school_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleDownload(pdf)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download PDF"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleApprove(pdf)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve PDF"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPdf(pdf);
                            const remarks = window.prompt('Enter rejection remarks:');
                            if (remarks) {
                              handleReject(pdf, remarks);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Reject PDF"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}