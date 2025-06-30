'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <nav className="navbar-fixed bg-white border-b border-gray-200 p-4 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            <span style={{ color: '#16a34a' }}>Buy↓</span>
            <span style={{ color: '#6b21a8' }}>Sell↑</span>
            <span className="text-gray-900">Hold</span>
          </Link>
          <div className="text-gray-500">Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar-fixed bg-white border-b border-gray-200 p-4 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex justify-between items-center">
        <Link
          href="/" className="text-2xl font-bold">
          <span style={{ color: '#16a34a' }}>Buy↓</span>
          <span style={{ color: '#6b21a8' }}>Sell↑</span>
          <span className="text-gray-900">Hold</span>
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-black hover:text-gray-700 transition-colors duration-200 p-2"
              title="Sign Out"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
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