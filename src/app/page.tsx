'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import StockCard from '@/components/StockCard';
import AddStockModal from '@/components/AddStockModal';
import { PlusIcon } from '@heroicons/react/24/outline';
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await axios.get('/api/watchlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!user?.id,
  });

  // Use watchlist directly without filtering
  const filteredWatchlist = watchlist;

  // Add stock to watchlist mutation
  const addStockMutation = useMutation({
    mutationFn: async (stockData: StockData) => {
      console.log('Mutation function called with:', stockData);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session ? 'Present' : 'Missing');
      console.log('Session user:', session?.user?.id);
      const token = session?.access_token;
      console.log('Token:', token ? `Present (${token.length} chars)` : 'Missing');
      
      const response = await axios.post('/api/watchlist', {
        stockSymbol: stockData.symbol,
        upperThreshold: stockData.highPrice,
        lowerThreshold: stockData.lowPrice,
        currentPrice: stockData.price,
        initialPrice: stockData.initialPrice || stockData.price,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('API response:', response.data);
      return response.data;
    },
    onSuccess: () => {
      console.log('Stock added successfully');
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
    onError: (error: unknown) => {
      console.error('Error adding stock:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 409) {
          alert(`Stock is already in your watchlist!`);
        } else if (axiosError.response?.data?.error?.includes('Database table not set up')) {
          alert('Database not set up. Please contact the administrator to set up the database table.');
        } else {
          alert('Failed to add stock. Please try again.');
        }
      } else {
        alert('Failed to add stock. Please try again.');
      }
    },
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async (stockData: StockData) => {
      console.log('Update mutation called with:', stockData);
      if (!stockData.id) throw new Error('Stock ID required');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      console.log('Update: Token present:', !!token);
      
      const requestBody = {
        id: stockData.id,
        upperThreshold: stockData.highPrice,
        lowerThreshold: stockData.lowPrice,
        currentPrice: stockData.price,
        initialPrice: stockData.initialPrice || stockData.price,
      };
      console.log('Update: Request body:', requestBody);
      
      const response = await axios.put('/api/watchlist', requestBody, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Update: API response:', response.data);
      return response.data;
    },
    onSuccess: () => {
      console.log('Update: Success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.id] });
    },
    onError: (error) => {
      console.error('Update: Error updating stock:', error);
    },
  });

  // Delete stock mutation
  const deleteStockMutation = useMutation({
    mutationFn: async (stockId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await axios.delete(`/api/watchlist?id=${stockId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
  const convertWatchlistToStockData = (item: WatchlistItem): StockData => ({
    id: item.id,
    symbol: item.stock_symbol,
    price: item.current_price,
    change: 0, // Will be updated when we fetch current price
    changePercent: '0%',
    volume: 0,
    latestTradingDay: new Date().toISOString().split('T')[0],
    lowPrice: item.lower_threshold,
    highPrice: item.upper_threshold,
    lowPercentage: 0,
    highPercentage: 0,
    initialPrice: item.initial_price,
  });

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
    <main className="min-h-screen bg-white text-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">


        {watchlistLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderBottomColor: '#6b21a8' }}></div>
            <p className="mt-4 text-gray-600">Loading your watchlist...</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
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
