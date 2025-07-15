/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import StockCard from '@/components/StockCard';
import { supabase } from '@/lib/supabase';
import React from 'react';

interface StockData {
  id?: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  latestTradingDay: string;
  lowPrice: number;
  highPrice: number;
  lowPercentage: number;
  highPercentage: number;
  initialPrice?: number;
  targetPrice?: number;
}

interface WatchlistItem {
  id: string;
  stock_symbol: string;
  current_price: number;
  lower_threshold: number;
  upper_threshold: number;
  initial_price: number;
  target_price: number;
  updated_at: string;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Add local state for live prices
  const [livePrices, setLivePrices] = useState<{ [key: string]: number }>({});
  const [sortOption, setSortOption] = useState<'alphabetical' | 'changeFromTargetPercent' | 'changeFromTargetDollar'>(() => {
    // Initialize from localStorage, default to alphabetical if not found
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sortPreference');
      if (saved && ['alphabetical', 'changeFromTargetPercent', 'changeFromTargetDollar'].includes(saved)) {
        return saved as 'alphabetical' | 'changeFromTargetPercent' | 'changeFromTargetDollar';
      }
    }
    return 'alphabetical';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.sort-dropdown-container')) {
        setIsSortDropdownOpen(false);
      }
    };

    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortDropdownOpen]);

  // Save sort preference to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sortPreference', sortOption);
    }
  }, [sortOption]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Listen for addStock events from navbar and update existing stocks
  useEffect(() => {
    if (user && !authLoading) {
      const handleAddStockEvent = (event: CustomEvent) => {
        handleAddStock(event.detail);
      };

      window.addEventListener('addStock', handleAddStockEvent as EventListener);
      
      return () => {
        window.removeEventListener('addStock', handleAddStockEvent as EventListener);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);



  // Fetch user's watchlist from database
  const { data: watchlist = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get fresh session and handle potential auth issues
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        // Force re-authentication
        await supabase.auth.signOut();
        router.push('/login');
        return [];
      }
      
      if (!session?.access_token) {
        console.log('No access token, redirecting to login');
        router.push('/login');
        return [];
      }
      
      try {
        const response = await axios.get('/api/watchlist', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        return response.data;
      } catch (error: unknown) {
        console.error('Watchlist fetch error:', error);
        
        // If 401, try to refresh session
        if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401) {
          console.log('401 error, attempting session refresh');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession?.access_token) {
            console.log('Session refresh failed, redirecting to login');
            await supabase.auth.signOut();
            router.push('/login');
            return [];
          }
          
          // Retry with refreshed token
          try {
            const retryResponse = await axios.get('/api/watchlist', {
              headers: { Authorization: `Bearer ${refreshedSession.access_token}` }
            });
            return retryResponse.data;
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            await supabase.auth.signOut();
            router.push('/login');
            return [];
          }
        }
        
        // For other errors, return empty array
        return [];
      }
    },
    enabled: !!user?.id,
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch live prices for all stocks in the watchlist after initial load
  useEffect(() => {
    if (watchlist && watchlist.length > 0) {
      let isMounted = true;
      const fetchPrices = async () => {
        const updates: Record<string, number> = {};
        await Promise.all(
          watchlist.map(async (item: any) => {
            try {
              const res = await axios.get(`/api/stocks?symbol=${item.stock_symbol}`);
              if (res.data && res.data.price) {
                updates[item.id] = res.data.price;
              }
            } catch {
              // Ignore errors, fallback to DB price
            }
          })
        );
        if (isMounted) {
          setLivePrices(updates);
        }
      };
      fetchPrices();
      return () => { isMounted = false; };
    }
  }, [watchlist]);

  // Update existing stocks in navbar when watchlist changes
  useEffect(() => {
    if (watchlist && watchlist.length > 0) {
      const existingStocks = watchlist.map((item: WatchlistItem) => ({ symbol: item.stock_symbol }));
      window.dispatchEvent(new CustomEvent('updateExistingStocks', { detail: existingStocks }));
    } else {
      window.dispatchEvent(new CustomEvent('updateExistingStocks', { detail: [] }));
    }
  }, [watchlist]);

  // Filter watchlist based on search query
  const filteredWatchlist = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return watchlist;
    }
    
    const query = searchQuery.trim().toUpperCase();
    return watchlist.filter((item: WatchlistItem) => 
      item.stock_symbol.toUpperCase().startsWith(query)
    );
  }, [watchlist, searchQuery]);

  // Sort the watchlist based on the selected option
  const sortedWatchlist = React.useMemo(() => {
    if (sortOption === 'alphabetical') {
      return [...filteredWatchlist].sort((a, b) => a.stock_symbol.localeCompare(b.stock_symbol));
    } else if (sortOption === 'changeFromTargetPercent') {
      const sorted = [...filteredWatchlist].sort((a, b) => {
        // Use the same calculation as StockCard component
        const aInitialPrice = a.initial_price || a.current_price;
        const bInitialPrice = b.initial_price || b.current_price;
        const aCurrentPrice = livePrices[a.id] ?? a.current_price;
        const bCurrentPrice = livePrices[b.id] ?? b.current_price;
        
        const aPercent = aInitialPrice > 0 ? ((aCurrentPrice - aInitialPrice) / aInitialPrice) * 100 : 0;
        const bPercent = bInitialPrice > 0 ? ((bCurrentPrice - bInitialPrice) / bInitialPrice) * 100 : 0;
        
        return bPercent - aPercent; // Sort by highest percentage change first (positive to negative)
      });
      
      return sorted;
    } else if (sortOption === 'changeFromTargetDollar') {
      return [...filteredWatchlist].sort((a, b) => {
        // Use the same calculation as StockCard component
        const aInitialPrice = a.initial_price || a.current_price;
        const bInitialPrice = b.initial_price || b.current_price;
        const aCurrentPrice = livePrices[a.id] ?? a.current_price;
        const bCurrentPrice = livePrices[b.id] ?? b.current_price;
        
        const aDollar = aCurrentPrice - aInitialPrice;
        const bDollar = bCurrentPrice - bInitialPrice;
        
        return bDollar - aDollar; // Sort by highest dollar change first (positive to negative)
      });
    }
    return filteredWatchlist;
  }, [filteredWatchlist, sortOption, livePrices]);

  // Add stock to watchlist mutation
  const addStockMutation = useMutation({
    mutationFn: async (stockData: StockData) => {
      console.log('=== ADD STOCK MUTATION START ===');
      console.log('Mutation function called with:', stockData);
      console.log('Current user:', user?.id);
      
      // Get fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session check result:', {
        hasSession: !!session,
        hasToken: !!session?.access_token,
        tokenLength: session?.access_token?.length,
        sessionError: sessionError?.message
      });
      
      if (sessionError) {
        console.error('Session error in mutation:', sessionError);
        await supabase.auth.signOut();
        router.push('/login');
        throw new Error('Authentication required');
      }
      
      if (!session?.access_token) {
        console.error('No access token available');
        await supabase.auth.signOut();
        router.push('/login');
        throw new Error('Authentication required');
      }
      
      console.log('Token preview:', session.access_token.substring(0, 20) + '...');
      
      const requestBody = {
        stockSymbol: stockData.symbol,
        upperThreshold: stockData.highPrice,
        lowerThreshold: stockData.lowPrice,
        currentPrice: stockData.price,
        initialPrice: stockData.initialPrice || stockData.price,
        targetPrice: stockData.targetPrice || stockData.initialPrice || stockData.price,
      };
      
      console.log('Request body:', requestBody);
      
      try {
        console.log('Making API request...');
        const response = await axios.post('/api/watchlist', requestBody, {
          headers: { 
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('API response success:', response.data);
        return response.data;
      } catch (error: unknown) {
        console.error('=== ADD STOCK ERROR ===');
        console.error('Error type:', error && typeof error === 'object' && 'constructor' in error ? (error as any).constructor.name : 'Unknown');
        console.error('Error message:', error && typeof error === 'object' && 'message' in error ? (error as any).message : 'No error message');
        console.error('Response status:', error && typeof error === 'object' && 'response' in error && (error as any).response && typeof (error as any).response === 'object' && 'status' in (error as any).response ? (error as any).response.status : 'No response status');
        console.error('Response data:', error && typeof error === 'object' && 'response' in error && (error as any).response && typeof (error as any).response === 'object' && 'data' in (error as any).response ? (error as any).response.data : 'No response data');
        console.error('Request headers:', error && typeof error === 'object' && 'config' in error && (error as any).config && typeof (error as any).config === 'object' && 'headers' in (error as any).config ? (error as any).config.headers : 'No request headers');
        
        // If 401, try to refresh session and retry
        if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401) {
          console.log('401 error detected, attempting session refresh...');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          console.log('Refresh result:', {
            hasRefreshedSession: !!refreshedSession,
            hasRefreshedToken: !!refreshedSession?.access_token,
            refreshError: refreshError?.message
          });
          
          if (refreshError || !refreshedSession?.access_token) {
            console.log('Session refresh failed, signing out');
            await supabase.auth.signOut();
            router.push('/login');
            throw new Error('Authentication required');
          }
          
          console.log('Retrying with refreshed token...');
          // Retry with refreshed token
          const retryResponse = await axios.post('/api/watchlist', requestBody, {
            headers: { 
              Authorization: `Bearer ${refreshedSession.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('Retry successful:', retryResponse.data);
          return retryResponse.data;
        }
        
        // Re-throw the error for the onError handler
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Stock added successfully');
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
    onError: (error: unknown) => {
      console.error('=== MUTATION ONERROR ===');
      console.error('Error in onError:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        console.error('Axios error details:', {
          status: (axiosError.response as any).status,
          data: (axiosError.response as any).data
        });
        
        if ((axiosError.response as any).status === 409) {
          alert(`Stock is already in your watchlist!`);
        } else if ((axiosError.response as any).data?.error?.includes('Database table not set up')) {
          alert('Database not set up. Please contact the administrator to set up the database table.');
        } else if ((axiosError.response as any).status === 401) {
          alert('Authentication failed. Please log in again.');
          router.push('/login');
        } else {
          alert('Failed to add stock. Please try again.');
        }
      } else {
        console.error('Non-axios error:', error);
        alert('Failed to add stock. Please try again.');
      }
    },
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async (stockData: StockData) => {
      console.log('Update mutation called with:', stockData);
      if (!stockData.id) throw new Error('Stock ID required');
      
      // Get fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.error('Session error in update mutation:', sessionError);
        await supabase.auth.signOut();
        router.push('/login');
        throw new Error('Authentication required');
      }
      
      console.log('Update: Token present:', !!session.access_token);
      
      const requestBody = {
        id: stockData.id,
        upperThreshold: stockData.highPrice,
        lowerThreshold: stockData.lowPrice,
        currentPrice: stockData.price,
        initialPrice: stockData.initialPrice || stockData.price,
        targetPrice: stockData.targetPrice || stockData.initialPrice || stockData.price,
      };
      console.log('Update: Request body:', requestBody);
      
      try {
        const response = await axios.put('/api/watchlist', requestBody, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        console.log('Update: API response:', response.data);
        return response.data;
      } catch (error: unknown) {
        console.error('Update stock error:', error);
        
        // If 401, try to refresh session and retry
        if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401) {
          console.log('401 error in update mutation, attempting session refresh');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession?.access_token) {
            console.log('Session refresh failed in update mutation');
            await supabase.auth.signOut();
            router.push('/login');
            throw new Error('Authentication required');
          }
          
          // Retry with refreshed token
          const retryResponse = await axios.put('/api/watchlist', requestBody, {
            headers: { Authorization: `Bearer ${refreshedSession.access_token}` }
          });
          return retryResponse.data;
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Update: Success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
    onError: (error: unknown) => {
      console.error('Update: Error updating stock:', error);
    },
  });

  // Delete stock mutation
  const deleteStockMutation = useMutation({
    mutationFn: async (stockId: string) => {
      // Get fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.error('Session error in delete mutation:', sessionError);
        await supabase.auth.signOut();
        router.push('/login');
        throw new Error('Authentication required');
      }
      
      try {
        await axios.delete(`/api/watchlist?id=${stockId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      } catch (error: unknown) {
        console.error('Delete stock error:', error);
        
        // If 401, try to refresh session and retry
        if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 401) {
          console.log('401 error in delete mutation, attempting session refresh');
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession?.access_token) {
            console.log('Session refresh failed in delete mutation');
            await supabase.auth.signOut();
            router.push('/login');
            throw new Error('Authentication required');
          }
          
          // Retry with refreshed token
          await axios.delete(`/api/watchlist?id=${stockId}`, {
            headers: { Authorization: `Bearer ${refreshedSession.access_token}` }
          });
        } else {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
  });

  const handleAddStock = (stockData: StockData) => {
    console.log('Adding stock:', stockData);
    console.log('User ID:', user?.id);
    addStockMutation.mutate(stockData);
  };

  const handleUpdateStock = (updatedStock: StockData) => {
    updateStockMutation.mutate(updatedStock);
  };

  const handleDeleteStock = (stockId: string) => {
    deleteStockMutation.mutate(stockId);
  };

  // Convert watchlist items to StockData format for StockCard
  const convertWatchlistToStockData = (item: WatchlistItem): StockData => {
    const initialPrice = item.initial_price || item.current_price;
    const lowPercentage = initialPrice ? ((item.lower_threshold - initialPrice) / initialPrice) * 100 : 0;
    const highPercentage = initialPrice ? ((item.upper_threshold - initialPrice) / initialPrice) * 100 : 0;
    // Use live price if available
    const price = livePrices[item.id] ?? item.current_price;
    
    return {
      id: item.id,
      symbol: item.stock_symbol,
      price: price,
      change: 0, // Will be updated when we fetch current price
      changePercent: '0%',
      volume: 0,
      latestTradingDay: new Date().toISOString().split('T')[0],
      lowPrice: item.lower_threshold,
      highPrice: item.upper_threshold,
      lowPercentage: Number(lowPercentage.toFixed(2)),
      highPercentage: Number(highPercentage.toFixed(2)),
      initialPrice: initialPrice,
      targetPrice: item.target_price || initialPrice,
    };
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect to login)
  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="pwa-main-fix max-w-7xl mx-auto px-4">
        {watchlistLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderBottomColor: '#6b21a8' }}></div>
            <p className="mt-4 text-gray-600">Loading your watchlist...</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mb-14">
          {/* Sort and Search controls */}
          {watchlist.length > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by symbol..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-base font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder-gray-500"
                    style={{ fontSize: '16px' }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Sort dropdown */}
              <div className="relative sort-dropdown-container flex-shrink-0">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  title="Sort options"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span className="hidden sm:inline">Sort</span>
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-[#181A20] border border-gray-700 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setSortOption('alphabetical');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1E2026] ${
                          sortOption === 'alphabetical' ? 'bg-[#1E2026] text-white' : 'text-gray-300'
                        }`}
                      >
                        Alphabetical
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('changeFromTargetPercent');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1E2026] ${
                          sortOption === 'changeFromTargetPercent' ? 'bg-[#1E2026] text-white' : 'text-gray-300'
                        }`}
                      >
                        Change from Target (%)
                      </button>
                      <button
                        onClick={() => {
                          setSortOption('changeFromTargetDollar');
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1E2026] ${
                          sortOption === 'changeFromTargetDollar' ? 'bg-[#1E2026] text-white' : 'text-gray-300'
                        }`}
                      >
                        Change from Target ($)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {filteredWatchlist.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-black">
              {searchQuery.trim() ? (
                // No search results
                <div>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-gray-400">
                    <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2 className="text-xl font-semibold mb-2 text-gray-600">No results found</h2>
                  <p className="text-gray-500 mb-4">No stocks match &quot;{searchQuery}&quot;</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                // Empty watchlist state
                <>
                  {/* Simple illustration - only green, grey, purple */}
                  <svg width="96" height="48" viewBox="0 0 96 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
                    <rect x="10" y="24" width="16" height="20" rx="3" fill="#16a34a"/>
                    <rect x="40" y="12" width="16" height="32" rx="3" fill="#9ca3af"/>
                    <rect x="70" y="4" width="16" height="40" rx="3" fill="#9333ea"/>
                    <circle cx="18" cy="22" r="4" fill="#16a34a"/>
                    <circle cx="48" cy="10" r="4" fill="#9ca3af"/>
                    <circle cx="78" cy="2" r="4" fill="#9333ea"/>
                    <polyline points="18,22 48,10 78,2" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2 className="text-2xl font-bold mb-4">Track stocks with BuySellHold in 3 steps:</h2>
                  <ol className="list-decimal list-inside text-left max-w-md mx-auto mb-6 space-y-2">
                    <li><b>Add a stock</b> — Enter a ticker to fetch its price.</li>
                    <li><b>Set your range</b> — Pick a buy (low) and sell (high) price.</li>
                    <li><span className="font-bold">Watch the color</span> —
                      <ul className="list-none ml-0 mt-2 space-y-1">
                        <li> • <span className="inline-block align-middle" style={{ verticalAlign: 'middle' }}><svg width="16" height="16" viewBox="0 0 16 16" style={{ display: 'inline' }}><circle cx="8" cy="8" r="8" fill="#16a34a" /></svg></span> <b>Buy:</b> price is low</li>
                        <li> • <span className="inline-block align-middle" style={{ verticalAlign: 'middle' }}><svg width="16" height="16" viewBox="0 0 16 16" style={{ display: 'inline' }}><circle cx="8" cy="8" r="8" fill="#6b21a8" /></svg></span> <b>Sell:</b> price is high</li>
                        <li> • <span className="inline-block align-middle" style={{ verticalAlign: 'middle' }}><svg width="16" height="16" viewBox="0 0 16 16" style={{ display: 'inline' }}><circle cx="8" cy="8" r="8" fill="#9ca3af" /></svg></span> <b>Hold:</b> price is in between</li>
                      </ul>
                    </li>
                  </ol>
                  <p className="mb-2">Edit anytime. Click a stock to view it on Yahoo Finance.</p>
                  <button
                    className="mt-2 px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    onClick={() => window.dispatchEvent(new Event('openAddStockModal'))}
                  >
                    Add a stock
                  </button>
                </>
              )}
            </div>
          )}
          {sortedWatchlist.map((item: WatchlistItem) => (
            <StockCard
              key={item.id}
              {...convertWatchlistToStockData(item)}
              onUpdate={handleUpdateStock}
              onDelete={() => handleDeleteStock(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Modals are now rendered in the Navbar component */}
    </main>
  );
}
