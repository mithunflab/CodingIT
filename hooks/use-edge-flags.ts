import { useState, useEffect, useCallback } from 'react';

interface EdgeFlagResponse {
  success: boolean;
  source: string;
  features?: Record<string, any>;
  flags?: Record<string, any>;
  metadata?: {
    featuresCount?: number;
    flagsCount?: number;
    dateUpdated?: string;
    cached?: boolean;
  };
  timestamp: string;
  error?: string;
}

interface UseEdgeFlagsOptions {
  useEdgeConfig?: boolean;
  refreshInterval?: number;
  onError?: (error: string) => void;
}

export function useEdgeFlags(options: UseEdgeFlagsOptions = {}) {
  const {
    useEdgeConfig = true,
    refreshInterval = 0, // 0 = no auto refresh
    onError
  } = options;

  const [flags, setFlags] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string>('unknown');

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = useEdgeConfig 
        ? '/api/edge-flags?edge=true'
        : '/api/edge-flags';

      const response = await fetch(url);
      const data: EdgeFlagResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch flags');
      }

      // Handle different response formats
      const flagData = data.features || data.flags || {};
      
      setFlags(flagData);
      setSource(data.source);
      setLastUpdated(data.timestamp);
      
      console.log(`🏁 Flags loaded from ${data.source}:`, {
        count: Object.keys(flagData).length,
        cached: data.metadata?.cached,
        dateUpdated: data.metadata?.dateUpdated
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Failed to fetch feature flags:', err);
    } finally {
      setLoading(false);
    }
  }, [useEdgeConfig, onError]);

  // Initial fetch
  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Auto refresh if interval is set
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchFlags, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchFlags, refreshInterval]);

  // Helper function to check if a flag is enabled
  const isEnabled = useCallback((flagKey: string, defaultValue: boolean = false): boolean => {
    if (loading) return defaultValue;
    const value = flags[flagKey];
    return value !== undefined ? Boolean(value) : defaultValue;
  }, [flags, loading]);

  // Helper function to get flag value
  const getValue = useCallback(<T = any>(flagKey: string, defaultValue: T): T => {
    if (loading) return defaultValue;
    const value = flags[flagKey];
    return value !== undefined ? value : defaultValue;
  }, [flags, loading]);

  // Helper function to check multiple flags
  const getValues = useCallback((flagKeys: string[]): Record<string, any> => {
    const result: Record<string, any> = {};
    flagKeys.forEach(key => {
      result[key] = flags[key];
    });
    return result;
  }, [flags]);

  return {
    // State
    flags,
    loading,
    error,
    lastUpdated,
    source,
    
    // Actions
    refresh: fetchFlags,
    
    // Helpers
    isEnabled,
    getValue,
    getValues,
    
    // Metadata
    count: Object.keys(flags).length,
    isFromCache: source === 'edge-config'
  };
}

// Hook for checking a single feature flag
export function useFeatureFlag(flagKey: string, defaultValue: boolean = false) {
  const { isEnabled, loading, error, refresh } = useEdgeFlags();
  
  return {
    enabled: isEnabled(flagKey, defaultValue),
    loading,
    error,
    refresh
  };
}

// Hook for getting a feature flag value
export function useFeatureValue<T = any>(flagKey: string, defaultValue: T) {
  const { getValue, loading, error, refresh } = useEdgeFlags();
  
  return {
    value: getValue(flagKey, defaultValue),
    loading,
    error,
    refresh
  };
}