interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <div className="relative">
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-2 border-gray-200`}></div>
        <div className={`animate-spin rounded-full ${sizeClasses[size]} border-2 border-blue-600 border-t-transparent absolute top-0 left-0`}></div>
      </div>
    </div>
  );
} 