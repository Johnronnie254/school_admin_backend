'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { schoolFeeService, type SchoolFee, type SchoolFeeFormData } from '@/services/schoolFeeService';

export default function SchoolFeesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SchoolFeeFormData>();

  // Fetch fee records for selected student
  const { data: feeRecords = [], isLoading } = useQuery({
    queryKey: ['feeRecords', selectedStudent],
    queryFn: () => selectedStudent ? schoolFeeService.getStudentFeeRecords(selectedStudent) : Promise.resolve([]),
    enabled: !!selectedStudent
  });

  // Initiate payment mutation
  const initiateMutation = useMutation({
    mutationFn: (data: SchoolFeeFormData) => 
      selectedStudent 
        ? schoolFeeService.initiatePayment(selectedStudent, data)
        : schoolFeeService.initiateFeePayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeRecords', selectedStudent] });
      toast.success('Payment initiated successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to initiate payment');
      }
    }
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: schoolFeeService.confirmPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeRecords', selectedStudent] });
      toast.success('Payment confirmed successfully');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to confirm payment');
      }
    }
  });

  const onSubmit = (data: SchoolFeeFormData) => {
    initiateMutation.mutate(data);
  };

  const handleConfirmPayment = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to confirm this payment?')) {
      confirmPaymentMutation.mutate(transactionId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
        <h1 className="text-2xl font-bold text-gray-900">School Fees</h1>
        <button
          onClick={() => {
            reset();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Initiate Payment
        </button>
      </div>

      {/* Student Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
        <input
          type="text"
          placeholder="Enter Student ID"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          onChange={(e) => setSelectedStudent(e.target.value)}
          value={selectedStudent || ''}
        />
      </div>

      {/* Fee Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {feeRecords.map((fee: SchoolFee) => (
              <tr key={fee.id}>
                <td className="px-6 py-4 whitespace-nowrap">KES {fee.amount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fee.term}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fee.year}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fee.payment_method}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                    {fee.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(fee.payment_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {fee.status === 'pending' && (
                    <button
                      onClick={() => handleConfirmPayment(fee.transaction_id)}
                      className="text-green-600 hover:text-green-900"
                      title="Confirm Payment"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Initiation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Initiate New Payment</h2>
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
                <label className="block text-sm font-medium text-gray-700">Amount (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { 
                    required: 'Amount is required',
                    min: { value: 0, message: 'Amount must be greater than 0' }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
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
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  {...register('payment_method', { required: 'Payment method is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Payment Method</option>
                  <option value="mpesa">M-PESA</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
                {errors.payment_method && (
                  <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
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
                  Initiate Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 