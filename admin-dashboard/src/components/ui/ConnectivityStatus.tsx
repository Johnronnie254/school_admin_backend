'use client';

import { useConnectivity } from '@/contexts/ConnectivityContext';
import { WifiIcon, NoSymbolIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, useRef } from 'react';

export default function ConnectivityStatus() {
  const { isOnline, checkNow } = useConnectivity();
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);
  const wasOfflineRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show/hide the status indicator based on connectivity
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setShow(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else if (wasOfflineRef.current) {
      // Only show 'restored' if we were previously offline
      setShow(true);
      wasOfflineRef.current = false;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShow(false);
      }, 2000); // show for 2 seconds
    }
  }, [isOnline]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRefresh = async () => {
    if (checking) return;

    setChecking(true);
    try {
      await checkNow();
    } finally {
      setChecking(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-center gap-2 p-3 rounded-md shadow-lg border transition-all duration-300 ${
          isOnline
            ? 'bg-green-100 border-green-200 text-green-800'
            : 'bg-red-100 border-red-200 text-red-800'
        }`}
      >
        {isOnline ? (
          <>
            <WifiIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Internet connection restored</span>
          </>
        ) : (
          <>
            <NoSymbolIcon className="h-5 w-5 text-red-600 animate-pulse" />
            <span className="text-sm font-medium">No Internet Connection</span>
            <button
              onClick={handleRefresh}
              className="ml-1 p-1 rounded-full hover:bg-red-200 transition-colors"
              title="Check connection again"
              disabled={checking}
            >
              <ArrowPathIcon
                className={`h-4 w-4 text-red-700 ${checking ? 'animate-spin' : ''}`}
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
