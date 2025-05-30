'use client';

import { useState } from 'react';
import EditStockModal from './EditStockModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { ArrowDownLeftIcon, ArrowUpRightIcon, ClockIcon, PencilSquareIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';

interface StockCardProps {
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
  onUpdate: (stock: StockCardProps) => void;
  onDelete: () => void;
}

export default function StockCard({
  symbol,
  price,
  change,
  changePercent,
  volume,
  latestTradingDay,
  companyName,
  lowPrice,
  highPrice,
  lowPercentage,
  highPercentage,
  initialPrice,
  onUpdate,
  onDelete,
}: StockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const getPriceColor = () => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-400';
  };

  const getChangeIcon = () => {
    if (change > 0) return <ArrowUpRightIcon className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDownLeftIcon className="w-4 h-4 text-red-500" />;
    return null;
  };

  const handleUpdate = (updatedStock: any) => {
    if (onUpdate) {
      onUpdate(updatedStock);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  // Calculate slider position (0-100%)
  const sliderPercent = Math.max(0, Math.min(100, ((initialPrice - lowPrice) / (highPrice - lowPrice)) * 100));

  // Determine current price container color
  let priceContainerBg = 'bg-[#181A20]';
  if (price < lowPrice) priceContainerBg = 'bg-green-700';
  else if (price > highPrice) priceContainerBg = 'bg-purple-700';

  return (
    <>
      <div className={`bg-[#181A20] p-4 flex flex-col shadow-md w-full rounded-lg hover:bg-[#1E2026] transition-colors duration-200 border border-gray-700`}>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            {/* Ticker and link */}
            <div className="flex flex-col items-start min-w-[120px]">
              <div className="flex items-center gap-1">
                <span className="text-white text-3xl font-semibold">{symbol}</span>
                <a href={`https://finance.yahoo.com/quote/${symbol}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>

            {/* Current price and change */}
            <div className="flex flex-col items-end min-w-[140px]">
              <span className="text-white text-xl font-semibold tabular-nums">${price.toFixed(2)}</span>
              <div className="flex items-center gap-1">
                {getChangeIcon()}
                <span className={`text-sm font-medium tabular-nums ${getPriceColor()}`}>
                  {change > 0 ? '+' : ''}{change.toFixed(2)} ({changePercent})
                </span>
              </div>
            </div>

            {/* Low/Slider/High section - only on large screens */}
            <div className="hidden lg:flex flex-1 items-center gap-8">
              {/* Low section */}
              <div className="flex flex-col items-center min-w-[120px]">
                <span className="text-gray-400 text-sm">Low</span>
                <span className="text-white text-sm font-medium tabular-nums">${lowPrice.toFixed(2)}</span>
                <span className="text-green-400 text-xs tabular-nums">{lowPercentage.toFixed(2)}%</span>
              </div>
              {/* Slider/track */}
              <div className="flex-1 flex flex-col items-center px-4">
                <div className="relative w-full h-10 flex items-end">
                  <div className="absolute w-full h-1 bg-gray-700 rounded-full opacity-80 top-6" />
                  {/* Current price above indicator */}
                  <div
                    className="absolute flex flex-col items-center"
                    style={{ left: `calc(${sliderPercent}% - 20px)` }}
                  >
                    <span className="text-xs text-white font-semibold mb-2 bg-[#181A20] px-1 rounded tabular-nums">${initialPrice.toFixed(2)}</span>
                    <svg width="20" height="10" viewBox="0 0 20 10">
                      <polygon points="10,0 20,10 0,10" fill="#fff" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* High section */}
              <div className="flex flex-col items-center min-w-[120px]">
                <span className="text-gray-400 text-sm">High</span>
                <span className="text-white text-sm font-medium tabular-nums">${highPrice.toFixed(2)}</span>
                <span className="text-purple-300 text-xs tabular-nums">{highPercentage.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className="hover:text-gray-100 text-gray-400 transition-colors duration-200 lg:hidden" title={isExpanded ? 'Collapse' : 'Expand'}>
            {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Expanded area (if needed) */}
        {isExpanded && (
          <div className="bg-[#1E2026] p-4 w-full lg:hidden mt-4 rounded-lg">
            {/* Low/Slider/High section for small/medium screens */}
            <div className="flex flex-col gap-6 lg:hidden">
              <div className="flex items-center gap-8">
                {/* Low section */}
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-gray-400 text-sm">Low</span>
                  <span className="text-white text-sm font-medium tabular-nums">${lowPrice.toFixed(2)}</span>
                  <span className="text-green-400 text-xs tabular-nums">{lowPercentage.toFixed(2)}%</span>
                </div>
                {/* Slider/track */}
                <div className="flex-1 flex flex-col items-center px-4">
                  <div className="relative w-full h-10 flex items-end">
                    <div className="absolute w-full h-1 bg-gray-700 rounded-full opacity-80 top-6" />
                    {/* Current price above indicator */}
                    <div
                      className="absolute flex flex-col items-center"
                      style={{ left: `calc(${sliderPercent}% - 20px)` }}
                    >
                      <span className="text-xs text-white font-semibold mb-2 bg-[#1E2026] px-1 rounded tabular-nums">${initialPrice.toFixed(2)}</span>
                      <svg width="20" height="10" viewBox="0 0 20 10">
                        <polygon points="10,0 20,10 0,10" fill="#fff" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* High section */}
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-gray-400 text-sm">High</span>
                  <span className="text-white text-sm font-medium tabular-nums">${highPrice.toFixed(2)}</span>
                  <span className="text-purple-300 text-xs tabular-nums">{highPercentage.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {onUpdate && (
        <EditStockModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdate}
          stock={{
            symbol,
            price,
            change,
            changePercent,
            volume,
            latestTradingDay,
            companyName,
            lowPrice,
            highPrice,
            lowPercentage,
            highPercentage,
            initialPrice,
          }}
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onDelete}
        symbol={symbol}
      />
    </>
  );
} 