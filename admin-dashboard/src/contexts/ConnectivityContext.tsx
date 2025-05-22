'use client';

import React, { createContext, useState, useContext, useEffect, useCallback, useRef, useMemo } from 'react';

interface ConnectivityContextType {
  isOnline: boolean;
  checkNow: () => Promise<boolean>;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  checkNow: async () => true,
});

export const useConnectivity = () => useContext(ConnectivityContext);

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const checkingRef = useRef(false);

  // Function to check connectivity by pinging the API
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous checks
    if (checkingRef.current) return isOnline;
    
    checkingRef.current = true;
    
    try {
      // Use a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/ping?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      const success = response.ok;
      
      if (success) {
        setConsecutiveSuccesses(prev => prev + 1);
        setConsecutiveFailures(0);
        
        // Only set online after 2 consecutive successes to prevent flickering
        if (consecutiveSuccesses >= 1 || !isOnline) {
          setIsOnline(true);
        }
      } else {
        setConsecutiveFailures(prev => prev + 1);
        setConsecutiveSuccesses(0);
        
        // Only set offline after 2 consecutive failures to prevent flickering
        if (consecutiveFailures >= 1) {
          setIsOnline(false);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Connectivity check failed:', error);
      setConsecutiveFailures(prev => prev + 1);
      setConsecutiveSuccesses(0);
      
      // Only set offline after 2 consecutive failures to prevent flickering
      if (consecutiveFailures >= 1) {
        setIsOnline(false);
      }
      
      return false;
    } finally {
      checkingRef.current = false;
    }
  }, [consecutiveFailures, consecutiveSuccesses, isOnline]);

  // Public method to check connectivity on demand
  const checkNow = useCallback(async (): Promise<boolean> => {
    return await checkConnectivity();
  }, [checkConnectivity]);

  // Set up event listeners for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConsecutiveSuccesses(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connectivity initially and periodically
    const intervalId = setInterval(() => {
      if (!document.hidden) {  // Only check when tab is visible
        checkConnectivity();
      }
    }, 60000); // Check every 60 seconds (reduced from 30s to avoid excessive checks)

    // Initial check
    checkConnectivity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkConnectivity]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isOnline,
    checkNow
  }), [isOnline, checkNow]);

  return (
    <ConnectivityContext.Provider value={contextValue}>
      {children}
    </ConnectivityContext.Provider>
  );
} 