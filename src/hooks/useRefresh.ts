'use client';

import { useCallback } from 'react';

export function useRefresh() {
  const refreshData = useCallback(async () => {
    try {
      console.log('Refreshing data...');
      
      // Simple page refresh for now
      window.location.reload();
      
    } catch (error) {
      console.error('Error during refresh:', error);
    }
  }, []);

  return { refreshData };
} 