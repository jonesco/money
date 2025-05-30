'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import StockCard from '@/components/StockCard';
import AddStockModal from '@/components/AddStockModal';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  latestTradingDay: string;
  companyName?: string;
  lowPrice: number;
  highPrice: number;
  lowPercentage: number;
  highPercentage: number;
  initialPrice: number;
}

const STORAGE_KEY = 'jonesco-watchlist';

export default function Home() {
  const [symbol, setSymbol] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<StockData[]>([]);

  // Load watchlist from localStorage on initial render
  useEffect(() => {
    const savedWatchlist = localStorage.getItem(STORAGE_KEY);
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch (error) {
        console.error('Error loading watchlist from localStorage:', error);
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const { data: stockData, isLoading, error } = useQuery({
    queryKey: ['stock', searchSymbol],
    queryFn: async () => {
      if (!searchSymbol) return null;
      const response = await axios.get(`/api/stocks?symbol=${searchSymbol}`);
      return response.data;
    },
    enabled: !!searchSymbol,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchSymbol(symbol.toUpperCase());
  };

  const handleAddStock = (stockData: StockData) => {
    setWatchlist(prev => [...prev, stockData]);
  };

  const handleUpdateStock = (updatedStock: StockData) => {
    setWatchlist(prev => prev.map(stock => 
      stock.symbol === updatedStock.symbol ? updatedStock : stock
    ));
  };

  const handleDeleteStock = (symbol: string) => {
    setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
  };

  return (
    <main className="min-h-screen bg-[#181A20] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">JONE$CO</h1>
        </div>

        {/* Search and Add Stock */}
        <div className="flex items-center gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Search stocks..."
                className="w-full px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
          >
            <PlusIcon className="w-5 h-5" />
            Add Stock
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading stock data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> Failed to fetch stock data. Please try again.</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {watchlist.map((stock, index) => (
            <StockCard
              key={`${stock.symbol}-${index}`}
              {...stock}
              onUpdate={handleUpdateStock}
              onDelete={() => handleDeleteStock(stock.symbol)}
            />
          ))}
          {stockData && !watchlist.some(stock => stock.symbol === stockData.symbol) && (
            <StockCard {...stockData} />
          )}
        </div>
      </div>

      <AddStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddStock}
        existingStocks={watchlist}
      />
    </main>
  );
}
