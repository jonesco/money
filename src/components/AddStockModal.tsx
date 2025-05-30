'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stockData: StockData) => void;
  existingStocks: { symbol: string }[];
}

export default function AddStockModal({ isOpen, onClose, onAdd, existingStocks }: AddStockModalProps) {
  const [ticker, setTicker] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [lowPrice, setLowPrice] = useState<number | null>(null);
  const [highPrice, setHighPrice] = useState<number | null>(null);
  const [lowPercentage, setLowPercentage] = useState<number | null>(null);
  const [highPercentage, setHighPercentage] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setTicker('');
    setCurrentPrice(null);
    setCompanyName('');
    setLowPrice(null);
    setHighPrice(null);
    setLowPercentage(null);
    setHighPercentage(null);
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentPrice) {
      const low = currentPrice * 0.9;
      const high = currentPrice * 1.1;
      setLowPrice(Number(low.toFixed(2)));
      setHighPrice(Number(high.toFixed(2)));
      setLowPercentage(-10);
      setHighPercentage(10);
    }
  }, [currentPrice]);

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(e.target.value.toUpperCase());
    setCurrentPrice(null);
    setCompanyName('');
    setError('');
  };

  const handleGetPrice = async () => {
    if (!ticker) {
      setError('Please enter a ticker symbol');
      return;
    }

    // Check if stock already exists
    if (existingStocks.some(stock => stock.symbol === ticker)) {
      setError('This stock is already being tracked');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/stocks?symbol=${ticker}`);
      setCurrentPrice(response.data.price);
      setCompanyName(response.data.companyName);
    } catch (error) {
      setError('Failed to fetch stock data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLowPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && currentPrice) {
      setLowPrice(value);
      const percentage = ((value - currentPrice) / currentPrice) * 100;
      setLowPercentage(Number(percentage.toFixed(2)));
    }
  };

  const handleHighPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && currentPrice) {
      setHighPrice(value);
      const percentage = ((value - currentPrice) / currentPrice) * 100;
      setHighPercentage(Number(percentage.toFixed(2)));
    }
  };

  const handleLowPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && currentPrice) {
      setLowPercentage(value);
      const price = currentPrice * (1 + value / 100);
      setLowPrice(Number(price.toFixed(2)));
    }
  };

  const handleHighPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && currentPrice) {
      setHighPercentage(value);
      const price = currentPrice * (1 + value / 100);
      setHighPrice(Number(price.toFixed(2)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPrice || !lowPrice || !highPrice) {
      setError('Please fetch the current price first');
      return;
    }

    if (lowPrice >= highPrice) {
      setError('Low price must be less than high price');
      return;
    }

    // Double check stock doesn't exist before adding
    if (existingStocks.some(stock => stock.symbol === ticker)) {
      setError('This stock is already being tracked');
      return;
    }

    onAdd({
      symbol: ticker,
      price: currentPrice,
      change: 0,
      changePercent: "0",
      volume: 0,
      latestTradingDay: new Date().toISOString().split('T')[0],
      companyName,
      lowPrice,
      highPrice,
      lowPercentage,
      highPercentage,
      initialPrice: currentPrice,
    });

    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#181A20] border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Add Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-1">
              Stock Symbol
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="symbol"
                value={ticker}
                onChange={handleTickerChange}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGetPrice();
                  }
                }}
                className="flex-1 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                placeholder="Enter stock symbol (e.g., AAPL)"
                required
              />
              <button
                type="button"
                onClick={handleGetPrice}
                disabled={isLoading}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Get Price'}
              </button>
            </div>
          </div>

          {currentPrice && (
            <>
              <div className="bg-[#1E2026] p-3 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300">
                  Current price: ${currentPrice.toFixed(2)}
                </p>
                {companyName && (
                  <p className="text-sm text-gray-300">
                    Company: {companyName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="initialPrice" className="block text-sm font-medium text-gray-300 mb-1">
                  Initial Price
                </label>
                <input
                  type="number"
                  id="initialPrice"
                  value={currentPrice}
                  readOnly
                  className="w-full px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                  placeholder="Enter initial price"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="lowPrice" className="block text-sm font-medium text-gray-300 mb-1">
                  Low Price
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="lowPrice"
                    value={lowPrice || ''}
                    onChange={handleLowPriceChange}
                    className="flex-1 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                    placeholder="Enter low price"
                    step="0.01"
                    required
                  />
                  <input
                    type="number"
                    value={lowPercentage || ''}
                    onChange={handleLowPercentageChange}
                    className="w-24 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                    placeholder="%"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="highPrice" className="block text-sm font-medium text-gray-300 mb-1">
                  High Price
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="highPrice"
                    value={highPrice || ''}
                    onChange={handleHighPriceChange}
                    className="flex-1 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                    placeholder="Enter high price"
                    step="0.01"
                    required
                  />
                  <input
                    type="number"
                    value={highPercentage || ''}
                    onChange={handleHighPercentageChange}
                    className="w-24 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                    placeholder="%"
                    step="0.1"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!currentPrice}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 disabled:opacity-50"
            >
              Add Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 