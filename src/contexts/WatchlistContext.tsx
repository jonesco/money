'use client';

import React, { createContext, useContext, useState } from 'react';

interface WatchlistContextType {
  watchlistLength: number;
  setWatchlistLength: (length: number) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlistLength, setWatchlistLength] = useState(0);

  return (
    <WatchlistContext.Provider value={{ watchlistLength, setWatchlistLength }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
} 