'use client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

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

  // Function to check connectivity by pinging the API
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
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
      checkConnectivity();
    }, 30000); // Check every 30 seconds

    // Initial check
    checkConnectivity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkConnectivity]);

  return (
    <ConnectivityContext.Provider value={{ isOnline, checkNow }}>
      {children}
    </ConnectivityContext.Provider>
  );
} 