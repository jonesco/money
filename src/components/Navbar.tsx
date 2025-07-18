'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowPathIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import AddStockModal from './AddStockModal';
import SettingsModal from './SettingsModal';

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sortOption?: string;
  onSortChange?: (option: string) => void;
  isSortDropdownOpen?: boolean;
  onSortDropdownToggle?: () => void;
  watchlistLength?: number;
}

export default function Navbar({
  searchQuery = '',
  onSearchChange,
  sortOption = 'alphabetical',
  onSortChange,
  isSortDropdownOpen = false,
  onSortDropdownToggle,
  watchlistLength = 0
}: NavbarProps) {
  const { user, signOut, loading } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [existingStocks, setExistingStocks] = useState<{ symbol: string }[]>([]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleAddStock = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenSettings = () => {
    setIsSettingsModalOpen(true);
    setIsOverflowOpen(false);
  };

  const handleLogout = () => {
    handleSignOut();
    setIsOverflowOpen(false);
  };

  // Listen for custom events from other components
  useEffect(() => {
    const handleOpenAddModal = () => setIsAddModalOpen(true);
    const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
    const handleUpdateExistingStocks = (event: CustomEvent) => {
      setExistingStocks(event.detail);
    };

    window.addEventListener('openAddStockModal', handleOpenAddModal);
    window.addEventListener('openSettingsModal', handleOpenSettingsModal);
    window.addEventListener('updateExistingStocks', handleUpdateExistingStocks as EventListener);
    
    return () => {
      window.removeEventListener('openAddStockModal', handleOpenAddModal);
      window.removeEventListener('openSettingsModal', handleOpenSettingsModal);
      window.removeEventListener('updateExistingStocks', handleUpdateExistingStocks as EventListener);
    };
  }, []);

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOverflowOpen(false);
    if (isOverflowOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOverflowOpen]);

  if (loading) {
    return (
      <nav className="navbar-fixed bg-white p-4" style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div className="flex justify-between items-center w-full" style={{ paddingTop: '16px' }}>
          <Link href="/" className="text-2xl font-bold">
            <span style={{ color: '#16a34a' }}>Buy<span style={{ fontSize: '1.2em' }}>↓</span></span>
            <span style={{ color: '#9333ea' }}>Sell<span style={{ fontSize: '1.2em' }}>↑</span></span>
            <span style={{ color: '#1e293b' }}>Hold</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar-fixed bg-white p-4" style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
      <div className="flex flex-col gap-4" style={{ paddingTop: '16px' }}>
        {/* Top row: Logo and user controls */}
        <div className="flex justify-between items-center w-full">
          <Link href="/" className="text-2xl md:text-4xl font-bold">
            <span style={{ color: '#16a34a' }}>Buy<span style={{ fontSize: '1.2em' }}>↓</span></span>
            <span style={{ color: '#9333ea' }}>Sell<span style={{ fontSize: '1.2em' }}>↑</span></span>
            <span style={{ color: '#1e293b' }}>Hold</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={handleRefresh}
                  className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
                >
                  <ArrowPathIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={handleAddStock}
                  className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
                >
                  <PlusIcon className="h-6 w-6" />
                </button>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOverflowOpen(!isOverflowOpen);
                    }}
                    className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
                  >
                    <UserCircleIcon className="h-6 w-6" />
                  </button>
                  {isOverflowOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#181A20] rounded-md shadow-lg border border-gray-700 z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-700">
                        <span className="block text-sm font-medium text-white truncate">
                          {user.user_metadata?.name || user.email}
                        </span>
                      </div>
                      <button
                        onClick={handleOpenSettings}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#1E2026] transition-colors duration-200"
                      >
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#1E2026] transition-colors duration-200"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded transition-colors duration-200"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Bottom row: Search and sort controls */}
        {user && watchlistLength > 0 && onSearchChange && onSortChange && onSortDropdownToggle && (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Filter by symbol..."
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-base font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder-gray-500"
                  style={{ fontSize: '16px' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Sort dropdown */}
            <div className="relative sort-dropdown-container flex-shrink-0">
              <button
                onClick={onSortDropdownToggle}
                className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                title="Sort options"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span className="hidden sm:inline">Sort</span>
              </button>
              
              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-[#181A20] border border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onSortChange('alphabetical');
                        onSortDropdownToggle();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1E2026] ${
                        sortOption === 'alphabetical' ? 'bg-[#1E2026] text-white' : 'text-gray-300'
                      }`}
                    >
                      Alphabetical
                    </button>
                    <button
                      onClick={() => {
                        onSortChange('changeFromTargetPercent');
                        onSortDropdownToggle();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1E2026] ${
                        sortOption === 'changeFromTargetPercent' ? 'bg-[#1E2026] text-white' : 'text-gray-300'
                      }`}
                    >
                      Change from Target (%)
                    </button>
                    <button
                      onClick={() => {
                        onSortChange('changeFromTargetDollar');
                        onSortDropdownToggle();
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1E2026] ${
                        sortOption === 'changeFromTargetDollar' ? 'bg-[#1E2026] text-white' : 'text-gray-300'
                      }`}
                    >
                      Change from Target ($)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modals rendered as part of the navbar */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(stockData) => {
          // Dispatch event for the main page to handle
          window.dispatchEvent(new CustomEvent('addStock', { detail: stockData }));
          setIsAddModalOpen(false);
        }}
        existingStocks={existingStocks}
      />
      
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </nav>
  );
}