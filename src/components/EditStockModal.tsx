'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface StockData {
  id?: string;
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

interface EditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (stockData: StockData) => void;
  stock: StockData;
}

export default function EditStockModal({ isOpen, onClose, onUpdate, stock }: EditStockModalProps) {
  const [lowPrice, setLowPrice] = useState(stock.lowPrice);
  const [highPrice, setHighPrice] = useState(stock.highPrice);
  const [lowPercentage, setLowPercentage] = useState(stock.lowPercentage);
  const [highPercentage, setHighPercentage] = useState(stock.highPercentage);
  const [initialPrice, setInitialPrice] = useState(stock.initialPrice);

  useEffect(() => {
    if (isOpen) {
      setLowPrice(stock.lowPrice);
      setHighPrice(stock.highPrice);
      setLowPercentage(stock.lowPercentage);
      setHighPercentage(stock.highPercentage);
      setInitialPrice(stock.initialPrice);
      
      // Scroll to top to ensure modal is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen, stock]);

  const handleLowPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && initialPrice) {
      setLowPrice(value);
      const percentage = ((value - initialPrice) / initialPrice) * 100;
      setLowPercentage(Number(percentage.toFixed(2)));
    }
  };

  const handleHighPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && initialPrice) {
      setHighPrice(value);
      const percentage = ((value - initialPrice) / initialPrice) * 100;
      setHighPercentage(Number(percentage.toFixed(2)));
    }
  };

  const handleLowPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && initialPrice) {
      setLowPercentage(value);
      const price = initialPrice * (1 + value / 100);
      setLowPrice(Number(price.toFixed(2)));
    }
  };

  const handleHighPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && initialPrice) {
      setHighPercentage(value);
      const price = initialPrice * (1 + value / 100);
      setHighPrice(Number(price.toFixed(2)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lowPrice >= highPrice) {
      return;
    }

    onUpdate({
      ...stock,
      id: stock.id,
      lowPrice,
      highPrice,
      lowPercentage,
      highPercentage,
      initialPrice,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      latestTradingDay: stock.latestTradingDay,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Modal - positioned as mega header */}
      <div
        className="fixed z-10 bg-[#181A20] border-b border-gray-700 p-6 overflow-y-auto shadow-lg"
        style={{
          top: '72px',
          left: '0',
          right: '0',
          width: '100%',
          height: 'auto',
          maxHeight: 'calc(100vh - 72px)',
          position: 'fixed',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Edit Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="my-6">
            <p className="text-lg font-semibold text-white mb-1">
              {stock.companyName ? `${stock.companyName} (${stock.symbol})` : stock.symbol}
            </p>
            <p className="text-sm text-gray-300">
              Current price: ${stock.price?.toFixed(2)}
            </p>
          </div>

          <div>
            <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-300 mb-1">
              Target Price
            </label>
            <input
              type="number"
              id="targetPrice"
              value={initialPrice}
              onChange={(e) => setInitialPrice(Number(e.target.value))}
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
                value={lowPrice}
                onChange={handleLowPriceChange}
                className="flex-1 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                placeholder="Enter low price"
                step="0.01"
                required
              />
              <input
                type="number"
                value={lowPercentage}
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
                value={highPrice}
                onChange={handleHighPriceChange}
                className="flex-1 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                placeholder="Enter high price"
                step="0.01"
                required
              />
              <input
                type="number"
                value={highPercentage}
                onChange={handleHighPercentageChange}
                className="w-24 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                placeholder="%"
                step="0.1"
                required
              />
            </div>
          </div>

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
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 