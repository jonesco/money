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
  const [symbol, setSymbol] = useState<string>(stock.symbol);

  useEffect(() => {
    if (isOpen) {
      setLowPrice(stock.lowPrice);
      setHighPrice(stock.highPrice);
      setLowPercentage(stock.lowPercentage);
      setHighPercentage(stock.highPercentage);
      setInitialPrice(stock.initialPrice);
      setSymbol(stock.symbol);
    }
  }, [isOpen, stock]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#181A20] border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Edit Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-1">
              Stock Symbol
            </label>
            <input
              type="text"
              id="symbol"
              value={symbol}
              readOnly
              className="w-full px-4 py-2 bg-[#2A2D36] border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
              placeholder="Stock symbol"
            />
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
            <input
              type="number"
              id="lowPrice"
              value={lowPrice}
              onChange={(e) => setLowPrice(Number(e.target.value))}
              className="w-full px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
              placeholder="Enter low price"
              step="0.01"
              required
            />
          </div>

          <div>
            <label htmlFor="highPrice" className="block text-sm font-medium text-gray-300 mb-1">
              High Price
            </label>
            <input
              type="number"
              id="highPrice"
              value={highPrice}
              onChange={(e) => setHighPrice(Number(e.target.value))}
              className="w-full px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
              placeholder="Enter high price"
              step="0.01"
              required
            />
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