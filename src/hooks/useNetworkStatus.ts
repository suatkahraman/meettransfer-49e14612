import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  offlineSince: Date | null;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    offlineSince: null,
  });

  const handleOnline = useCallback(() => {
    setStatus(prev => ({
      isOnline: true,
      wasOffline: prev.offlineSince !== null,
      offlineSince: null,
    }));
    
    // Reset wasOffline after a short delay to allow reconnect message to show
    setTimeout(() => {
      setStatus(prev => ({
        ...prev,
        wasOffline: false,
      }));
    }, 3000);
  }, []);

  const handleOffline = useCallback(() => {
    setStatus({
      isOnline: false,
      wasOffline: false,
      offlineSince: new Date(),
    });
  }, []);

  useEffect(() => {
    // Initial check
    setStatus(prev => ({
      ...prev,
      isOnline: navigator.onLine,
    }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
};

export default useNetworkStatus;
