'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  XMarkIcon,
  CheckCircleIcon,
  BanknotesIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';
import { schoolFeeService, type SchoolFee, type SchoolFeeFormData } from '@/services/schoolFeeService';
import { Dialog } from '@headlessui/react';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <BanknotesIcon className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">School Fees</h1>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              reset();
              setIsModalOpen(true);
            }}
            disabled={initiateMutation.isPending || confirmPaymentMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <PlusIcon className="h-5 w-5" />
            Initiate Payment
          </button>
        </div>
      </div>

      {/* Student Selection */}
      <div className="mb-6 max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Student
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Enter Student ID"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            onChange={(e) => setSelectedStudent(e.target.value)}
            value={selectedStudent || ''}
          />
          <div className="absolute right-2 top-2 group">
            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />
            <div className="hidden group-hover:block absolute right-0 top-6 bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
              Enter the student&apos;s ID to view their fee records
            </div>
          </div>
        </div>
      </div>

      {isLoading || initiateMutation.isPending || confirmPaymentMutation.isPending ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !selectedStudent ? (
        <div className="text-center py-12">
          <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No student selected</h3>
          <p className="mt-1 text-sm text-gray-500">Enter a student&apos;s ID to view fee records.</p>
        </div>
      ) : feeRecords.length === 0 ? (
        <div className="text-center py-12">
          <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No fee records</h3>
          <p className="mt-1 text-sm text-gray-500">This student has no fee records yet.</p>
        </div>
      ) : (
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
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    KES {fee.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.term}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize text-sm text-gray-900">{fee.payment_method}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(fee.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
      )}

      {/* Payment Initiation Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-6 py-8 shadow-xl transition-all sm:w-full sm:max-w-2xl">
            <div className="absolute right-4 top-4">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="rounded-full bg-blue-50 p-2">
                <BanknotesIcon className="h-6 w-6 text-blue-600" />
              </div>
              <Dialog.Title className="text-lg font-semibold leading-6 text-gray-900">
                Initiate New Payment
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
                    Amount (KES)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2 relative">
                    <input
                      type="number"
                      step="0.01"
                      {...register('amount', { 
                        required: 'Amount is required',
                        min: { value: 0, message: 'Amount must be greater than 0' }
                      })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter amount"
                    />
                    {errors.amount && (
                      <p className="mt-2 text-sm text-red-600">{errors.amount.message}</p>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="mt-2">
                    <select
                      {...register('payment_method', { required: 'Payment method is required' })}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    >
                      <option value="">Select Payment Method</option>
                      <option value="mpesa">M-PESA</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </select>
                    {errors.payment_method && (
                      <p className="mt-2 text-sm text-red-600">{errors.payment_method.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                  className="rounded-md px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  disabled={initiateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                  disabled={initiateMutation.isPending}
                >
                  {initiateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Initiating Payment...
                    </div>
                  ) : (
                    'Initiate Payment'
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