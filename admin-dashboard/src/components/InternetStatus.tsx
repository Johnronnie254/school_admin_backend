import { useEffect, useState } from 'react';
import { WifiIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

export function InternetStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    // Add event listeners for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      // Hide the banner after 3 seconds
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2 transition-all duration-300 ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      } text-white`}
    >
      {isOnline ? (
        <WifiIcon className="h-5 w-5" />
      ) : (
        <NoSymbolIcon className="h-5 w-5" />
      )}
      <span className="font-medium">
        {isOnline ? 'Back Online' : 'No Internet Connection'}
      </span>
    </div>
  );
} 