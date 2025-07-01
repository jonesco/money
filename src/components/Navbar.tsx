'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightOnRectangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRefresh = () => {
    window.location.reload();
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
              <button
                onClick={handleRefresh}
                className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
                title="Refresh"
              >
                <ArrowPathIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleSignOut}
                className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
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