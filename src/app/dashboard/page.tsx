'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type WatchlistItem = {
  id: string;
  stock_symbol: string;
  upper_threshold: number;
  lower_threshold: number;
  current_price: number;
  created_at: string;
};

export default function DashboardPage() {
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [stockSymbol, setStockSymbol] = useState('');
  const [upperThreshold, setUpperThreshold] = useState('');
  const [lowerThreshold, setLowerThreshold] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [setupMessage, setSetupMessage] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Setup database function
  const handleSetupDatabase = async () => {
    setSetupMessage('Checking database setup...');
    try {
      const response = await fetch('/api/setup-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.status === 'ready') {
          setSetupMessage('Database is ready! Refreshing...');
          // Refresh the page to reload the watchlist
          window.location.reload();
        } else {
          setSetupMessage(data.message + '\n\n' + data.sql);
        }
      } else {
        setSetupMessage('Setup error: ' + data.error);
      }
    } catch (err) {
      setSetupMessage('Setup failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Fetch watchlist on mount
  useEffect(() => {
    if (user && session?.access_token) {
      console.log('Dashboard: Fetching watchlist with token length:', session.access_token.length);
      console.log('Dashboard: Token preview:', session.access_token.substring(0, 20) + '...');
      
      // Check if session needs refresh
      const checkAndRefreshSession = async () => {
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession()
          if (error) {
            console.error('Dashboard: Session error, signing out:', error)
            await supabase.auth.signOut()
            return
          }
          
          if (!currentSession) {
            console.log('Dashboard: No current session, redirecting to login')
            router.push('/login')
            return
          }
          
          // Use the current session for the API call
          fetch('/api/watchlist', {
            headers: {
              'Authorization': `Bearer ${currentSession.access_token}`,
              'Content-Type': 'application/json',
            },
          })
            .then(res => {
              console.log('Dashboard: Watchlist response status:', res.status);
              return res.json();
            })
            .then(data => {
              console.log('Dashboard: Watchlist data received:', data);
              if (data.error) {
                console.error('Dashboard: API error:', data.error);
                setError(data.error);
                setWatchlist([]);
              } else {
                setWatchlist(Array.isArray(data) ? data : []);
              }
              setLoading(false);
            })
            .catch(err => {
              console.error('Dashboard: Error fetching watchlist:', err);
              setLoading(false);
            });
        } catch (error) {
          console.error('Dashboard: Error checking session:', error)
          setLoading(false);
        }
      }
      
      checkAndRefreshSession();
    } else {
      console.log('Dashboard: No user or session token available');
      console.log('Dashboard: User:', user);
      console.log('Dashboard: Session:', session);
      setLoading(false);
    }
  }, [user, session, router]);

  // Add stock to watchlist
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session?.access_token) return;
    
    setError('');
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        stockSymbol,
        upperThreshold: parseFloat(upperThreshold),
        lowerThreshold: parseFloat(lowerThreshold),
      }),
    });
    if (res.ok) {
      const newStock = await res.json();
      setWatchlist([...watchlist, newStock]);
      setStockSymbol('');
      setUpperThreshold('');
      setLowerThreshold('');
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add stock');
    }
  };

  // Delete stock from watchlist
  const handleDeleteStock = async (id: string) => {
    if (!user || !session?.access_token) return;
    
    const res = await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setWatchlist(prev => prev.filter(stock => stock.id !== id));
    }
  };

  // Edit stock in watchlist
  const handleEditStock = async (id: string, field: string, currentValue: number) => {
    if (!user || !session?.access_token) return;
    
    const newValue = prompt(`Enter new ${field} value:`, currentValue.toString());
    if (newValue === null || newValue === '') return;
    
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
      return;
    }
    
    setError('');
    
    // Map field names to API field names
    const fieldMap: { [key: string]: string } = {
      'upper': 'upperThreshold',
      'lower': 'lowerThreshold',
      'price': 'currentPrice'
    };
    
    const apiField = fieldMap[field];
    if (!apiField) {
      setError('Invalid field');
      return;
    }
    
    const res = await fetch('/api/watchlist', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        id,
        [apiField]: numValue,
      }),
    });
    
    if (res.ok) {
      const updatedStock = await res.json();
      setWatchlist(prev => prev.map(stock => stock.id === id ? updatedStock : stock));
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to edit stock');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Simple test section */}
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="font-bold text-red-800">Authentication Test</h3>
          <p>User ID: {user?.id || 'No user'}</p>
          <p>Session exists: {session ? 'Yes' : 'No'}</p>
          <p>Token exists: {session?.access_token ? 'Yes' : 'No'}</p>
          <button
            onClick={() => {
              console.log('Current user:', user);
              console.log('Current session:', session);
              if (session?.access_token) {
                fetch('/api/test-auth', {
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                  },
                })
                .then(r => r.json())
                .then(data => {
                  console.log('Auth test result:', data);
                  alert(JSON.stringify(data, null, 2));
                })
                .catch(err => {
                  console.error('Auth test error:', err);
                  alert('Error: ' + err.message);
                });
              } else {
                alert('No access token available');
              }
            }}
            className="bg-red-500 text-white px-4 py-2 rounded mt-2"
          >
            Test Authentication
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Stock Watchlist</h1>
        
        {/* Debug info */}
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
          <p><strong>Debug Info:</strong></p>
          <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
          <p>Session: {session ? 'Available' : 'Not available'}</p>
          <p>Token: {session?.access_token ? `Available (${session.access_token.length} chars)` : 'Not available'}</p>
          <button
            onClick={() => {
              console.log('Dashboard: User:', user);
              console.log('Dashboard: Session:', session);
              console.log('Dashboard: Token preview:', session?.access_token?.substring(0, 20) + '...');
            }}
            className="bg-green-500 text-white px-2 py-1 rounded text-sm"
            style={{ backgroundColor: '#16a34a' }}
          >
            Log Debug Info
          </button>
        </div>

        {/* Database Setup Section */}
        {error && error.includes('Database table not set up') && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded">
            <h3 className="font-bold text-blue-800 mb-2">Database Setup Required</h3>
            <p className="text-blue-700 mb-3">Your database table needs to be set up. Click the button below to check and set up the database.</p>
            <button
              onClick={handleSetupDatabase}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
            >
              Setup Database
            </button>
            {setupMessage && (
              <div className="mt-3 p-3 bg-white border border-blue-200 rounded">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">{setupMessage}</pre>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAddStock} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
              placeholder="Stock Symbol (e.g., AAPL)"
              className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-500"
              required
            />
            <input
              type="number"
              value={upperThreshold}
              onChange={(e) => setUpperThreshold(e.target.value)}
              placeholder="Upper Threshold"
              step="0.01"
              className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-500"
              required
            />
            <input
              type="number"
              value={lowerThreshold}
              onChange={(e) => setLowerThreshold(e.target.value)}
              placeholder="Lower Threshold"
              step="0.01"
              className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-500"
              required
            />
            <button 
              type="submit" 
              className="bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
            >
              <span className="hidden sm:inline">Add Stock</span>
              <span className="sm:hidden text-xl font-bold">+</span>
            </button>
          </div>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </form>

        <div className="grid gap-4">
          {watchlist.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-xl">No stocks in your watchlist yet.</p>
              <p className="mt-2">Add your first stock above to get started!</p>
            </div>
          ) : (
            watchlist.map((item) => (
              <div key={item.id} className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <h2 className="text-2xl font-bold text-gray-900">{item.stock_symbol}</h2>
                      <p className="text-gray-600 sm:ml-4">Current Price: ${item.current_price.toFixed(2)}</p>
                    </div>
                    <p className="text-gray-600 mt-1">Added: {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <div className="flex flex-col sm:items-end w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium" style={{ color: '#16a34a' }}>Upper: ${item.upper_threshold.toFixed(2)}</p>
                        <button
                          onClick={() => handleEditStock(item.id, 'upper', item.upper_threshold)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-red-600 font-medium">Lower: ${item.lower_threshold.toFixed(2)}</p>
                        <button
                          onClick={() => handleEditStock(item.id, 'lower', item.lower_threshold)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-600 font-medium">Price: ${item.current_price.toFixed(2)}</p>
                        <button
                          onClick={() => handleEditStock(item.id, 'price', item.current_price)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteStock(item.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors duration-200 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 