import { useEffect, useState } from 'react';
import { syncEngine } from '@/lib/syncEngine';
import { isOnline } from '@/lib/offlineDb';

export function useOfflineSync() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error'>(syncEngine.getStatus());
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    // Start sync engine
    syncEngine.start();

    // Subscribe to status changes
    const unsubscribe = syncEngine.subscribe(setStatus);

    // Listen for online/offline
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = () => {
    if (online) {
      syncEngine.sync();
    }
  };

  return { status, online, triggerSync };
}
