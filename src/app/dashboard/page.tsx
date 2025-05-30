'use client';

import { useEffect, useState } from 'react';

type WatchlistItem = {
  id: string;
  stockSymbol: string;
  upperThreshold: number;
  lowerThreshold: number;
  currentPrice: number;
  lastUpdated: string;
};

export default function DashboardPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [stockSymbol, setStockSymbol] = useState('');
  const [upperThreshold, setUpperThreshold] = useState('');
  const [lowerThreshold, setLowerThreshold] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch watchlist on mount
  useEffect(() => {
    fetch('/api/watchlist')
      .then(res => res.json())
      .then(data => {
        setWatchlist(data);
        setLoading(false);
      });
  }, []);

  // Add stock to watchlist
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  // Update price for a stock
  const handleUpdatePrice = async (item: WatchlistItem) => {
    const res = await fetch('/api/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockSymbol: item.stockSymbol, watchlistId: item.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setWatchlist(prev => prev.map(stock => 
        stock.id === item.id ? { ...stock, currentPrice: data.price, lastUpdated: new Date().toISOString() } : stock
      ));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Stock Watchlist</h1>
      
      <form onSubmit={handleAddStock} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={stockSymbol}
            onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
            placeholder="Stock Symbol"
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            value={upperThreshold}
            onChange={(e) => setUpperThreshold(e.target.value)}
            placeholder="Upper Threshold"
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            value={lowerThreshold}
            onChange={(e) => setLowerThreshold(e.target.value)}
            placeholder="Lower Threshold"
            className="border p-2 rounded"
            required
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Add Stock
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>

      <div className="grid gap-4">
        {watchlist.map((item) => (
          <div key={item.id} className="border p-4 rounded">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{item.stockSymbol}</h2>
                <p>Current Price: ${item.currentPrice.toFixed(2)}</p>
                <p>Last Updated: {new Date(item.lastUpdated).toLocaleString()}</p>
              </div>
              <div>
                <p>Upper: ${item.upperThreshold.toFixed(2)}</p>
                <p>Lower: ${item.lowerThreshold.toFixed(2)}</p>
                <button
                  onClick={() => handleUpdatePrice(item)}
                  className="bg-green-500 text-white px-4 py-2 rounded mt-2"
                >
                  Update Price
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}