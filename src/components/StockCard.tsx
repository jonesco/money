'use client';

import { useState } from 'react';
import EditStockModal from './EditStockModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { ArrowDownLeftIcon, ArrowUpRightIcon, PencilSquareIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';

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
  initialPrice?: number;
}

interface StockCardProps extends StockData {
  onUpdate: (stock: StockCardProps) => void;
  onDelete: () => void;
}

export default function StockCard({
  id,
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
    const initialPriceValue = initialPrice || price;
    const priceChange = price - initialPriceValue;
    if (priceChange > 0) return { color: '#16a34a' };
    if (priceChange < 0) return { color: '#6b21a8' };
    return { color: '#9ca3af' };
  };

  const getChangeIcon = () => {
    const initialPriceValue = initialPrice || price;
    const priceChange = price - initialPriceValue;
    if (priceChange > 0) return <ArrowUpRightIcon className="w-4 h-4" style={{ color: '#16a34a' }} />;
    if (priceChange < 0) return <ArrowDownLeftIcon className="w-4 h-4" style={{ color: '#6b21a8' }} />;
    return null;
  };

  const getPriceChange = () => {
    const initialPriceValue = initialPrice || price;
    const priceChange = price - initialPriceValue;
    const percentageChange = initialPriceValue > 0 ? (priceChange / initialPriceValue) * 100 : 0;
    
    return {
      dollarChange: priceChange,
      percentageChange: percentageChange
    };
  };

  const getBorderColor = () => {
    if (price <= lowPrice) return { borderColor: '#16a34a' };
    if (price >= highPrice) return { borderColor: '#6b21a8' };
    return null; // No border for normal range
  };

  const getBorderClass = () => {
    if (price <= lowPrice || price >= highPrice) return 'border-4';
    return '';
  };

  const getBackgroundColor = () => {
    if (price <= lowPrice) return 'bg-gradient-to-r from-green-100 to-white';
    if (price >= highPrice) return 'bg-gradient-to-r from-purple-100 to-white';
    return 'bg-gray-50';
  };

  const handleUpdate = (updatedStock: StockData) => {
    onUpdate({
      ...updatedStock,
      onUpdate,
      onDelete,
    });
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  // Calculate slider position (0-100%)
  const sliderPercent = Math.max(0, Math.min(100, (((initialPrice || price) - lowPrice) / (highPrice - lowPrice)) * 100));

  return (
    <>
      <div 
        className={`${getBackgroundColor()} p-4 flex flex-col shadow-md w-full rounded-lg hover:bg-gray-100 transition-colors duration-200 ${getBorderClass()}`}
        style={getBorderColor() || undefined}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Ticker and current price */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {/* Ticker and link */}
              <div className="flex flex-col items-start min-w-[80px] sm:min-w-[120px]">
                <div className="flex items-center gap-1">
                  <span className="text-gray-900 text-xl sm:text-2xl md:text-3xl font-semibold">{symbol}</span>
                  <a href={`https://finance.yahoo.com/quote/${symbol}`} target="_blank" rel="noopener noreferrer" 
                     onMouseEnter={(e) => e.currentTarget.style.color = '#6b21a8'}
                     onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                     className="hover:text-purple-600">
                    <ArrowTopRightOnSquareIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                  </a>
                </div>
              </div>

              {/* Current price and change - positioned closer to ticker on all screen sizes */}
              <div className="flex flex-col items-start min-w-[100px] sm:min-w-[140px]">
                <span className="text-gray-900 text-lg sm:text-xl font-semibold tabular-nums">${price.toFixed(2)}</span>
                <div className="flex items-center gap-1">
                  {getChangeIcon()}
                  <span className="text-sm font-medium tabular-nums" style={getPriceColor()}>
                    {(() => {
                      const { dollarChange, percentageChange } = getPriceChange();
                      return (
                        <>
                          {dollarChange >= 0 ? '+' : ''}{dollarChange.toFixed(2)} ({percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%)
                        </>
                      );
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Low/Slider/High section - hidden on small screens, fills space on medium and large */}
            <div className="hidden md:flex flex-1 items-center gap-4 justify-between">
              {/* Low section */}
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-gray-600 text-sm">Low</span>
                <span className="text-gray-900 text-sm font-medium tabular-nums">${lowPrice.toFixed(2)}</span>
                <span className="text-xs tabular-nums" style={{ color: '#16a34a' }}>{lowPercentage.toFixed(2)}%</span>
              </div>
              {/* Slider/track - takes up remaining space */}
              <div className="flex-1 flex flex-col items-center px-4 max-w-[300px]">
                <div className="relative w-full h-10 flex items-end">
                  <div className="absolute w-full h-1 bg-gray-300 rounded-full opacity-80 top-6" />
                  {/* Current price above indicator */}
                  <div
                    className="absolute flex flex-col items-center"
                    style={{ left: `calc(${sliderPercent}% - 20px)` }}
                  >
                    <span className="text-xs text-gray-900 font-semibold mb-2 bg-gray-50 px-1 rounded tabular-nums">${(initialPrice || price).toFixed(2)}</span>
                    <svg width="20" height="10" viewBox="0 0 20 10">
                      <polygon points="10,0 20,10 0,10" fill="#374151" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* High section */}
              <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-gray-600 text-sm">High</span>
                <span className="text-gray-900 text-sm font-medium tabular-nums">${highPrice.toFixed(2)}</span>
                <span className="text-xs tabular-nums" style={{ color: '#6b21a8' }}>{highPercentage.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-600 hover:text-purple-600"
              style={{ '--tw-hover-opacity': '1' } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6b21a8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setIsExpanded(!isExpanded)} className="hover:text-gray-900 text-gray-600 transition-colors duration-200 md:hidden" title={isExpanded ? 'Collapse' : 'Expand'}>
              {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expanded area (if needed) */}
        {isExpanded && (
          <div className="bg-white p-4 w-full md:hidden mt-4 rounded-lg border border-gray-200">
            {/* Low/Slider/High section for small screens */}
            <div className="flex flex-col gap-6 md:hidden">
              <div className="flex items-center gap-8">
                {/* Low section */}
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-gray-600 text-sm">Low</span>
                  <span className="text-gray-900 text-sm font-medium tabular-nums">${lowPrice.toFixed(2)}</span>
                  <span className="text-xs tabular-nums" style={{ color: '#16a34a' }}>{lowPercentage.toFixed(2)}%</span>
                </div>
                {/* Slider/track */}
                <div className="flex-1 flex flex-col items-center px-4">
                  <div className="relative w-full h-10 flex items-end">
                    <div className="absolute w-full h-1 bg-gray-300 rounded-full opacity-80 top-6" />
                    {/* Current price above indicator */}
                    <div
                      className="absolute flex flex-col items-center"
                      style={{ left: `calc(${sliderPercent}% - 20px)` }}
                    >
                      <span className="text-xs text-gray-900 font-semibold mb-2 bg-white px-1 rounded tabular-nums">${(initialPrice || price).toFixed(2)}</span>
                      <svg width="20" height="10" viewBox="0 0 20 10">
                        <polygon points="10,0 20,10 0,10" fill="#374151" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* High section */}
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-gray-600 text-sm">High</span>
                  <span className="text-gray-900 text-sm font-medium tabular-nums">${highPrice.toFixed(2)}</span>
                  <span className="text-xs tabular-nums" style={{ color: '#6b21a8' }}>{highPercentage.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <EditStockModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdate}
        stock={{
          id,
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
          initialPrice: initialPrice || price,
        }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onDelete}
        symbol={symbol}
      />
    </>
  );
} 