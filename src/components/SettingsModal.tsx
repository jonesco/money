'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserPreferences {
  default_high_percentage: number;
  default_low_percentage: number;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [highPercentage, setHighPercentage] = useState<number>(10);
  const [lowPercentage, setLowPercentage] = useState<number>(-10);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        return;
      }

      const response = await fetch('/api/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const preferences: UserPreferences = await response.json();
        setHighPercentage(preferences.default_high_percentage);
        setLowPercentage(preferences.default_low_percentage);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to load preferences' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (highPercentage <= lowPercentage) {
      setMessage({ type: 'error', text: 'High percentage must be greater than low percentage' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        setMessage({ type: 'error', text: 'Authentication required' });
        return;
      }

      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          defaultHighPercentage: highPercentage,
          defaultLowPercentage: lowPercentage,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        // Notify other components that preferences have been updated
        window.dispatchEvent(new CustomEvent('preferencesUpdated'));
        // Close modal after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save preferences' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal - positioned as mega header */}
      <div
        className="fixed z-50 bg-[#181A20] border-b border-gray-700 p-6 overflow-y-auto shadow-lg"
        style={{
          top: '88px',
          left: '0',
          right: '0',
          width: '100%',
          height: 'auto',
          maxHeight: 'calc(100vh - 88px)',
          position: 'fixed',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            <span className="ml-3 text-white">Loading preferences...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Default Threshold Percentages</h3>
              <p className="text-sm text-gray-300 mb-4">
                Set your preferred default percentages for new stocks. These will be used when adding stocks to your watchlist.
              </p>
            </div>

            <div>
              <label htmlFor="highPercentage" className="block text-sm font-medium text-gray-300 mb-1">
                Default High Percentage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="highPercentage"
                  value={highPercentage}
                  onChange={(e) => setHighPercentage(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                  placeholder="10"
                  step="0.1"
                  min="0"
                  required
                />
                <span className="text-gray-300">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="lowPercentage" className="block text-sm font-medium text-gray-300 mb-1">
                Default Low Percentage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="lowPercentage"
                  value={lowPercentage}
                  onChange={(e) => setLowPercentage(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-4 py-2 bg-[#1E2026] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-400"
                  placeholder="-10"
                  step="0.1"
                  required
                />
                <span className="text-gray-300">%</span>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-900/20 border border-green-700 text-green-300' 
                  : 'bg-red-900/20 border border-red-700 text-red-300'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || highPercentage <= lowPercentage}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 