/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import StockCard from '@/components/StockCard';
import AddStockModal from '@/components/AddStockModal';
import { supabase } from '@/lib/supabase';

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
}

interface WatchlistItem {
  id: string;
  stock_symbol: string;
  current_price: number;
  lower_threshold: number;
  upper_threshold: number;
  initial_price: number;
  updated_at: string;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debug session on mount
  useEffect(() => {
    if (user) {
      console.log('Home: User authenticated:', user.id);
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('Home: Session check:', session ? 'Valid' : 'Invalid', error);
        if (session?.access_token) {
          console.log('Home: Token length:', session.access_token.length);
        }
      });
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Listen for custom event to open modal
  useEffect(() => {
    if (user && !authLoading) {
      const handleOpenModal = () => {
        setIsModalOpen(true);
      };

      window.addEventListener('openAddStockModal', handleOpenModal);
      
      return () => {
        window.removeEventListener('openAddStockModal', handleOpenModal);
      };
    }
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

  // Use watchlist directly without filtering
  const filteredWatchlist = watchlist;

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
    setIsModalOpen(false);
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
    
    return {
      id: item.id,
      symbol: item.stock_symbol,
      price: item.current_price,
      change: 0, // Will be updated when we fetch current price
      changePercent: '0%',
      volume: 0,
      latestTradingDay: new Date().toISOString().split('T')[0],
      lowPrice: item.lower_threshold,
      highPrice: item.upper_threshold,
      lowPercentage: Number(lowPercentage.toFixed(2)),
      highPercentage: Number(highPercentage.toFixed(2)),
      initialPrice: initialPrice,
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
          {filteredWatchlist.map((item: WatchlistItem) => (
            <StockCard
              key={item.id}
              {...convertWatchlistToStockData(item)}
              onUpdate={handleUpdateStock}
              onDelete={() => handleDeleteStock(item.id)}
            />
          ))}
          {filteredWatchlist.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No stocks in your watchlist yet. Add your first stock to get started!</p>
            </div>
          )}
        </div>
      </div>

      <AddStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddStock}
        existingStocks={watchlist.map(convertWatchlistToStockData)}
      />
    </main>
  );
}
