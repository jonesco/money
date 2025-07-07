import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserPreferences {
  default_high_percentage: number;
  default_low_percentage: number;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data: UserPreferences = await response.json();
        setPreferences(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load preferences');
      }
    } catch (err) {
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    preferences,
    loading,
    error,
    refetch: fetchPreferences,
  };
} 