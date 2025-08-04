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
      }, 3000); // show for 3 seconds
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

  // Don't render anything if not showing or if we're on the dashboard page (to avoid conflicts)
  if (!show || window.location.pathname === '/dashboard') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto animate-slide-in">
      <div
        className={`flex items-center gap-3 p-4 rounded-2xl shadow-strong border backdrop-blur-sm transition-all duration-300 ${
          isOnline
            ? 'bg-secondary-50/90 border-secondary-200/50 text-secondary-800'
            : 'bg-red-50/90 border-red-200/50 text-red-800'
        }`}
      >
        {isOnline ? (
          <>
            <div className="p-1 bg-secondary-100 rounded-lg">
              <WifiIcon className="h-5 w-5 text-secondary-600" />
            </div>
            <span className="text-sm font-semibold">Connection restored</span>
          </>
        ) : (
          <>
            <div className="p-1 bg-red-100 rounded-lg">
              <NoSymbolIcon className="h-5 w-5 text-red-600 animate-pulse" />
            </div>
            <span className="text-sm font-semibold">No Internet Connection</span>
            <button
              onClick={handleRefresh}
              className="ml-2 p-2 rounded-xl hover:bg-red-100 transition-colors duration-200 btn-transition"
              title="Check connection again"
              disabled={checking}
            >
              <ArrowPathIcon
                className={`h-4 w-4 text-red-600 ${checking ? 'animate-spin' : 'hover:rotate-180'} transition-transform duration-300`}
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
