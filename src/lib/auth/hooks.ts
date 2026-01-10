'use client';

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  iracingCustomerId: number;
  displayName: string;
  licenseClasses: Array<{
    category: string;
    level: string;
    safetyRating: number;
    iRating: number;
  }>;
  createdAt: string;
  lastSyncAt: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing authentication state
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const fetchUser = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user,
          loading: false,
          error: null,
        });
      } else if (response.status === 401) {
        setState({
          user: null,
          loading: false,
          error: null,
        });
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  const login = useCallback(() => {
    window.location.href = '/api/auth/login';
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setState({
        user: null,
        loading: false,
        error: null,
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const refreshTokens = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    ...state,
    login,
    logout,
    refreshTokens,
    refetch: fetchUser,
  };
}