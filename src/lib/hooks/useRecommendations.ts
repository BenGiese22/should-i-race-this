'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RecommendationMode, RecommendationResponse } from '@/lib/recommendations/types';
import { useFeatureFlags, getMockProfile } from '@/lib/feature-flags';

interface UseRecommendationsOptions {
  mode: RecommendationMode;
  category?: string;
  minScore?: number;
  maxResults?: number;
  includeAlmostEligible?: boolean;
}

interface UseRecommendationsReturn {
  data: RecommendationResponse | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
  isRetrying: boolean;
  refetch: () => Promise<void>;
}

// Exponential backoff delay calculation
const getRetryDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
};

// Check if error is retryable
const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504')
  );
};

export function useRecommendations(options: UseRecommendationsOptions): UseRecommendationsReturn {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const maxRetries = 3;

  // Check for mock profile
  const { flags } = useFeatureFlags();
  const mockProfile = flags.mockProfile;

  // If mock profile is active, return mock data immediately
  useEffect(() => {
    if (mockProfile) {
      const mockData = getMockProfile(mockProfile);
      if (mockData) {
        // Filter recommendations by category if specified
        let filteredRecommendations = mockData.recommendations;
        if (options.category) {
          filteredRecommendations = mockData.recommendations.filter(
            rec => rec.category === options.category
          );
        }

        // Sort by mode-appropriate score
        filteredRecommendations = [...filteredRecommendations].sort((a, b) => {
          if (options.mode === 'safety_recovery') {
            return b.score.factors.safety - a.score.factors.safety;
          } else if (options.mode === 'irating_push') {
            return b.score.factors.performance - a.score.factors.performance;
          }
          return b.score.overall - a.score.overall;
        });

        setData({
          ...mockData,
          recommendations: filteredRecommendations.slice(0, options.maxResults || 20),
        });
        setLoading(false);
        setError(null);
      }
    }
  }, [mockProfile, options.category, options.mode, options.maxResults]);

  const fetchRecommendations = useCallback(async (isRetry = false) => {
    // Skip API call if using mock data
    if (mockProfile) {
      return;
    }
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      if (!isRetry) {
        setLoading(true);
        setRetryCount(0);
      } else {
        setIsRetrying(true);
      }
      
      setError(null);
      
      const params = new URLSearchParams({
        mode: options.mode,
        maxResults: (options.maxResults || 20).toString(),
        includeAlmostEligible: (options.includeAlmostEligible || false).toString()
      });
      
      if (options.category) {
        params.append('category', options.category);
      }
      
      if (options.minScore !== undefined) {
        params.append('minScore', options.minScore.toString());
      }

      const response = await fetch(`/api/recommendations?${params}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      setData(result);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      // Don't handle aborted requests as errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Error fetching recommendations:', err);
      const error = err instanceof Error ? err : new Error('Failed to load recommendations');
      
      // Attempt retry for retryable errors
      if (isRetryableError(error) && retryCount < maxRetries && !isRetry) {
        const delay = getRetryDelay(retryCount);
        console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchRecommendations(true);
        }, delay);
        
        return;
      }
      
      setError(error.message);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [options.mode, options.category, options.minScore, options.maxResults, options.includeAlmostEligible, retryCount, mockProfile]);

  const manualRefetch = useCallback(async () => {
    // If using mock data, just trigger re-render by toggling loading
    if (mockProfile) {
      setLoading(true);
      setTimeout(() => setLoading(false), 100);
      return;
    }
    setRetryCount(0);
    await fetchRecommendations(false);
  }, [fetchRecommendations, mockProfile]);

  useEffect(() => {
    // Skip API fetch if using mock data (handled by separate useEffect above)
    if (mockProfile) {
      return;
    }

    fetchRecommendations();

    // Cleanup function to abort any pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRecommendations, mockProfile]);

  return {
    data,
    loading,
    error,
    retryCount,
    isRetrying,
    refetch: manualRefetch
  };
}