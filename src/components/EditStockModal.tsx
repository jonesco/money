'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ModalPortal from './ModalPortal';

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
  targetPrice: number;
}

interface EditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (stockData: StockData) => void;
  stock: StockData;
}

export default function EditStockModal({ isOpen, onClose, onUpdate, stock }: EditStockModalProps) {
  // Use string state for input fields to allow free typing
  const [lowPriceInput, setLowPriceInput] = useState(stock.lowPrice.toFixed(2));
  const [highPriceInput, setHighPriceInput] = useState(stock.highPrice.toFixed(2));
  const [targetPriceInput, setTargetPriceInput] = useState((stock.targetPrice || stock.initialPrice).toFixed(2));
  const [lowPercentage, setLowPercentage] = useState<number | null>(stock.lowPercentage);
  const [highPercentage, setHighPercentage] = useState<number | null>(stock.highPercentage);
  const [lowPrice, setLowPrice] = useState<number | null>(stock.lowPrice);
  const [highPrice, setHighPrice] = useState<number | null>(stock.highPrice);
  const [targetPrice, setTargetPrice] = useState<number | null>(stock.targetPrice || stock.initialPrice);

  useEffect(() => {
    if (isOpen) {
      setLowPrice(stock.lowPrice);
      setHighPrice(stock.highPrice);
      setLowPercentage(stock.lowPercentage);
      setHighPercentage(stock.highPercentage);
      setTargetPrice(stock.targetPrice || stock.initialPrice);
      setLowPriceInput(stock.lowPrice.toFixed(2));
      setHighPriceInput(stock.highPrice.toFixed(2));
      setTargetPriceInput((stock.targetPrice || stock.initialPrice).toFixed(2));
    }
  }, [isOpen, stock]);

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
      // Recalculate percentages based on new target price
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || !lowPrice || !highPrice) return;
    if (lowPrice >= highPrice) return;
    onUpdate({
      ...stock,
      id: stock.id,
      lowPrice,
      highPrice,
      lowPercentage: lowPercentage || 0,
      highPercentage: highPercentage || 0,
      targetPrice: targetPrice || 0,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      latestTradingDay: stock.latestTradingDay,
    });
    onClose();
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
              value={targetPriceInput}
              onChange={handleTargetPriceChange}
              onBlur={handleTargetPriceBlur}
              className="w-full px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
              placeholder="Enter target price"
              step="0.01"
              required
            />
          </div>

          {/* Remove the Initial Price input from the form */}

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
                value={lowPercentage != null ? lowPercentage : ''}
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
                value={highPercentage != null ? highPercentage : ''}
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
      {/* Dark overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    </ModalPortal>
  );
} 