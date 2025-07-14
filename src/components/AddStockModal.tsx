'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import ModalPortal from './ModalPortal';

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
  targetPrice: number;
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
  // Use string state for input fields to allow free typing
  const [targetPriceInput, setTargetPriceInput] = useState('');
  const [lowPriceInput, setLowPriceInput] = useState('');
  const [highPriceInput, setHighPriceInput] = useState('');
  const [targetPrice, setTargetPrice] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [lowPrice, setLowPrice] = useState<number | null>(null);
  const [highPrice, setHighPrice] = useState<number | null>(null);
  const [lowPercentage, setLowPercentage] = useState<number | null>(null);
  const [highPercentage, setHighPercentage] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const symbolInputRef = useRef<HTMLInputElement>(null);
  
  // Get user preferences for default percentages
  const { preferences, refetch: refetchPreferences } = useUserPreferences();

  const resetState = () => {
    setTicker('');
    setCurrentPrice(null);
    setTargetPrice(null);
    setTargetPriceInput('');
    setCompanyName('');
    setLowPrice(null);
    setLowPriceInput('');
    setHighPrice(null);
    setHighPriceInput('');
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
    if (isOpen) {
      refetchPreferences();
    } else {
      resetState();
    }
  }, [isOpen, refetchPreferences]);

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
    if (existingStocks.some(stock => stock.symbol === ticker)) {
      setError('This stock is already being tracked');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/stocks?symbol=${ticker}`);
      const price = response.data.price;
      setCurrentPrice(price);
      setCompanyName(response.data.companyName);
      setTargetPrice(price);
      setTargetPriceInput(price.toFixed(2));
      const defaultLowPercent = preferences?.default_low_percentage ?? -10;
      const defaultHighPercent = preferences?.default_high_percentage ?? 10;
      const low = price * (1 + (defaultLowPercent / 100));
      const high = price * (1 + (defaultHighPercent / 100));
      setLowPrice(Number(low.toFixed(2)));
      setLowPriceInput(low.toFixed(2));
      setHighPrice(Number(high.toFixed(2)));
      setHighPriceInput(high.toFixed(2));
      setLowPercentage(defaultLowPercent);
      setHighPercentage(defaultHighPercent);
    } catch {
      setError('Failed to fetch stock data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = () => {
    if (!currentPrice || !targetPrice || !lowPrice || !highPrice) {
      setError('Please set all required fields');
      return;
    }
    if (lowPrice >= highPrice) {
      setError('Low price must be less than high price');
      return;
    }
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
      lowPrice: Number(lowPrice.toFixed(2)),
      highPrice: Number(highPrice.toFixed(2)),
      lowPercentage: lowPercentage || 0,
      highPercentage: highPercentage || 0,
      initialPrice: currentPrice,
      targetPrice: Number(targetPrice.toFixed(2)),
    });
    handleClose();
  };

  const handleLowPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLowPriceInput(e.target.value);
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && targetPrice) {
      setLowPrice(value);
      const percentage = ((value - targetPrice) / targetPrice) * 100;
      setLowPercentage(Number(percentage.toFixed(2)));
    } else if (e.target.value === '') {
      setLowPrice(null);
      setLowPercentage(null);
    }
  };
  const handleLowPriceBlur = () => {
    if (lowPrice != null) setLowPriceInput(lowPrice.toFixed(2));
  };

  const handleHighPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHighPriceInput(e.target.value);
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && targetPrice) {
      setHighPrice(value);
      const percentage = ((value - targetPrice) / targetPrice) * 100;
      setHighPercentage(Number(percentage.toFixed(2)));
    } else if (e.target.value === '') {
      setHighPrice(null);
      setHighPercentage(null);
    }
  };
  const handleHighPriceBlur = () => {
    if (highPrice != null) setHighPriceInput(highPrice.toFixed(2));
  };

  const handleTargetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetPriceInput(e.target.value);
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setTargetPrice(value);
      if (lowPrice) {
        const lowPercentage = ((lowPrice - value) / value) * 100;
        setLowPercentage(Number(lowPercentage.toFixed(2)));
      }
      if (highPrice) {
        const highPercentage = ((highPrice - value) / value) * 100;
        setHighPercentage(Number(highPercentage.toFixed(2)));
      }
    } else if (e.target.value === '') {
      setTargetPrice(null);
      setLowPercentage(null);
      setHighPercentage(null);
    }
  };
  const handleTargetPriceBlur = () => {
    if (targetPrice != null) setTargetPriceInput(targetPrice.toFixed(2));
  };

  const handleLowPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && targetPrice) {
      setLowPercentage(Number(value.toFixed(2)));
      const price = targetPrice * (1 + value / 100);
      setLowPrice(price);
      setLowPriceInput(price.toFixed(2));
    } else if (e.target.value === '') {
      setLowPercentage(null);
      setLowPrice(null);
      setLowPriceInput('');
    }
  };

  const handleHighPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && targetPrice) {
      setHighPercentage(Number(value.toFixed(2)));
      const price = targetPrice * (1 + value / 100);
      setHighPrice(price);
      setHighPriceInput(price.toFixed(2));
    } else if (e.target.value === '') {
      setHighPercentage(null);
      setHighPrice(null);
      setHighPriceInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed z-50 bg-[#181A20] border-b border-gray-700 p-6 overflow-y-auto shadow-lg" style={{
        top: '64px',
        left: 0,
        right: 0,
        width: '100vw',
        maxWidth: '100vw',
        height: 'auto',
        maxHeight: 'calc(100vh - 64px)',
        position: 'fixed',
      }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Add Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          {currentPrice && (
            <>
              <div className="my-6">
                <p className="text-lg font-semibold text-white mb-1">
                  {companyName} ({ticker})
                </p>
                <p className="text-sm text-gray-300">
                  Current price: ${currentPrice.toFixed(2)}
                </p>
              </div>

              <div>
                <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-300 mb-1">
                  Target Price
                </label>
                <input
                  type="number"
                  id="targetPrice"
                  value={targetPriceInput}
                  onChange={handleTargetPriceChange}
                  onBlur={handleTargetPriceBlur}
                  className="w-full px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                  placeholder="Enter target price"
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
                    value={lowPriceInput}
                    onChange={handleLowPriceChange}
                    onBlur={handleLowPriceBlur}
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
                    value={highPriceInput}
                    onChange={handleHighPriceChange}
                    onBlur={handleHighPriceBlur}
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

          {/* Show label and input only if price has not been fetched */}
          {!currentPrice && (
            <div>
              <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-1">
                Stock Symbol
              </label>
              <input
                ref={symbolInputRef}
                type="text"
                id="symbol"
                name="stock-symbol"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck="false"
                value={ticker}
                onChange={handleTickerChange}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGetPrice();
                  }
                }}
                className="w-full px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                placeholder="Enter stock symbol (e.g., AAPL)"
                required
              />
            </div>
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
            {!currentPrice ? (
              <button
                type="button"
                onClick={handleGetPrice}
                disabled={isLoading || !ticker}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Get Price'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddStock}
                disabled={!targetPrice || !lowPrice || !highPrice || lowPrice >= highPrice}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 disabled:opacity-50"
              >
                Add Stock
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    </ModalPortal>
  );
} 