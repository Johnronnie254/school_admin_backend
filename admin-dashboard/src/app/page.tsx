import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to School Admin Portal
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          A comprehensive solution for managing your school&apos;s administrative tasks efficiently and effectively.
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-block px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Login to Dashboard
          </Link>
          
          <div className="mt-8 text-gray-600">
            <p>Features include:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-left max-w-2xl mx-auto">
              <div className="flex items-start space-x-2">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Teacher Management</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Student Records</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Class Scheduling</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Fee Management</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 