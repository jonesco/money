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

  // Remove stock from watchlist
  const handleRemoveStock = async (id: string) => {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setWatchlist(watchlist.filter(item => item.id !== id));
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
      setWatchlist(w