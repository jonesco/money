'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { useWatchlist } from '@/contexts/WatchlistContext';

export default function ClientNavbar() {
  const { watchlistLength } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('alphabetical');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Load sort preference from localStorage
  useEffect(() => {
    const savedSortOption = localStorage.getItem('sortOption');
    if (savedSortOption) {
      setSortOption(savedSortOption);
    }
  }, []);

  // Save sort preference to localStorage
  useEffect(() => {
    localStorage.setItem('sortOption', sortOption);
  }, [sortOption]);

  // Dispatch search and sort events for the main page to listen to
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('searchQueryChange', { detail: searchQuery }));
  }, [searchQuery]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sortOptionChange', { detail: sortOption }));
  }, [sortOption]);

  const handleSortDropdownToggle = () => {
    setIsSortDropdownOpen(!isSortDropdownOpen);
  };

  return (
    <Navbar
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      sortOption={sortOption}
      onSortChange={setSortOption}
      isSortDropdownOpen={isSortDropdownOpen}
      onSortDropdownToggle={handleSortDropdownToggle}
      watchlistLength={watchlistLength}
    />
  );
} 