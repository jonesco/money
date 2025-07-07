'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightOnRectangleIcon, ArrowPathIcon, PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

// Custom Tooltip Component
const Tooltip = ({ children, text, position = 'bottom' }: { children: React.ReactNode; text: string; position?: 'top' | 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg whitespace-nowrap ${positionClasses[position]}`}>
          {text}
          <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 ${
            position === 'top' 
              ? 'top-full border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900' 
              : 'bottom-full border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900'
          }`}></div>
        </div>
      )}
    </div>
  );
};

export default function Navbar() {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleAddStock = () => {
    // Dispatch a custom event to open the modal without refreshing
    window.dispatchEvent(new CustomEvent('openAddStockModal'));
  };

  const handleOpenSettings = () => {
    // Dispatch a custom event to open the settings modal
    window.dispatchEvent(new CustomEvent('openSettingsModal'));
  };

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
      <div className="flex justify-between items-center w-full" style={{ paddingTop: '16px' }}>
        <Link href="/" className="text-2xl font-bold">
          <span style={{ color: '#16a34a' }}>Buy<span style={{ fontSize: '1.2em' }}>↓</span></span>
          <span style={{ color: '#9333ea' }}>Sell<span style={{ fontSize: '1.2em' }}>↑</span></span>
          <span style={{ color: '#1e293b' }}>Hold</span>
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Tooltip text="Refresh">
                <button
                  onClick={handleRefresh}
                  className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
                >
                  <ArrowPathIcon className="h-6 w-6" />
                </button>
              </Tooltip>
              <Tooltip text="Add Stock">
                <button
                  onClick={handleAddStock}
                  className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
                >
                  <PlusIcon className="h-6 w-6" />
                </button>
              </Tooltip>
              <Tooltip text="Settings">
                <button
                  onClick={handleOpenSettings}
                  className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
                >
                  <Cog6ToothIcon className="h-6 w-6" />
                </button>
              </Tooltip>
              <Tooltip text="Logout">
                <button
                  onClick={handleSignOut}
                  className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
              </Tooltip>
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
    </nav>
  );
}