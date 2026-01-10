'use client';

import { useAuth } from '@/lib/auth/hooks';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface PerformanceMetric {
  seriesId?: number;
  seriesName?: string;
  trackId?: number;
  trackName?: string;
  avgStartingPosition: number;
  avgFinishingPosition: number;
  positionDelta: number;
  avgIncidents: number;
  raceCount: number;
}

type GroupingType = 'series' | 'track' | 'series_track';
type SessionType = 'practice' | 'qualifying' | 'time_trial' | 'race' | 'all';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<PerformanceMetric[]>([]);
  const [filteredAnalytics, setFilteredAnalytics] = useState<PerformanceMetric[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [groupBy, setGroupBy] = useState<GroupingType>('series');
  const [sessionType, setSessionType] = useState<SessionType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof PerformanceMetric>('raceCount');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sync race data
  const handleSyncData = async () => {
    setSyncLoading(true);
    setSyncError(null);
    
    try {
      const response = await fetch('/api/data/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync race data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh analytics data after successful sync
        await fetchAnalytics();
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSyncLoading(false);
    }
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    
    setAnalyticsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        groupBy,
        sessionType: sessionType === 'all' ? '' : sessionType,
      });
      
      const response = await fetch(`/api/data/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalytics(data.analytics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user, groupBy, sessionType]);

  // Filter and search analytics
  useEffect(() => {
    let filtered = [...analytics];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(metric => {
        const seriesMatch = metric.seriesName?.toLowerCase().includes(term);
        const trackMatch = metric.trackName?.toLowerCase().includes(term);
        return seriesMatch || trackMatch;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField] as number;
      const bVal = b[sortField] as number;
      
      if (sortDirection === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });
    
    setFilteredAnalytics(filtered);
  }, [analytics, searchTerm, sortField, sortDirection]);

  // Fetch data when filters change
  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, groupBy, sessionType, fetchAnalytics]);

  const handleSort = (field: keyof PerformanceMetric) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: keyof PerformanceMetric) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-racing-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-racing-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-racing-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const formatDelta = (delta: number) => {
    if (delta > 0) {
      return <span className="text-racing-improvement font-semibold">+{delta.toFixed(1)}</span>;
    } else if (delta < 0) {
      return <span className="text-racing-decline font-semibold">{delta.toFixed(1)}</span>;
    } else {
      return <span className="text-racing-neutral">0.0</span>;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-racing-gray-50 to-racing-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-racing-red mx-auto mb-4"></div>
          <p className="text-racing-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-racing-gray-50 to-racing-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-racing-gray-900 mb-2">Performance Analytics</h1>
              <p className="text-racing-gray-600">
                Analyze your racing performance across different series and tracks
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard/recommendations')}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Get Recommendations
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Group By Toggle */}
            <div>
              <label className="block text-sm font-medium text-racing-gray-700 mb-2">
                Group By
              </label>
              <div className="flex rounded-lg border border-racing-gray-300 overflow-hidden">
                <button
                  onClick={() => setGroupBy('series')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    groupBy === 'series'
                      ? 'bg-racing-blue text-white'
                      : 'bg-white text-racing-gray-700 hover:bg-racing-gray-50'
                  }`}
                >
                  Series
                </button>
                <button
                  onClick={() => setGroupBy('track')}
                  className={`px-3 py-2 text-sm font-medium transition-colors border-l border-racing-gray-300 ${
                    groupBy === 'track'
                      ? 'bg-racing-blue text-white'
                      : 'bg-white text-racing-gray-700 hover:bg-racing-gray-50'
                  }`}
                >
                  Track
                </button>
                <button
                  onClick={() => setGroupBy('series_track')}
                  className={`px-3 py-2 text-sm font-medium transition-colors border-l border-racing-gray-300 ${
                    groupBy === 'series_track'
                      ? 'bg-racing-blue text-white'
                      : 'bg-white text-racing-gray-700 hover:bg-racing-gray-50'
                  }`}
                >
                  Series + Track
                </button>
              </div>
            </div>

            {/* Session Type Filter */}
            <div>
              <label className="block text-sm font-medium text-racing-gray-700 mb-2">
                Session Type
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="w-full px-3 py-2 border border-racing-gray-300 rounded-lg focus:ring-2 focus:ring-racing-blue focus:border-transparent"
              >
                <option value="all">All Sessions</option>
                <option value="race">Race</option>
                <option value="qualifying">Qualifying</option>
                <option value="practice">Practice</option>
                <option value="time_trial">Time Trial</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-racing-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search series or tracks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-racing-gray-300 rounded-lg focus:ring-2 focus:ring-racing-blue focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-racing-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchAnalytics}
                disabled={analyticsLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {analyticsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="card mb-8 border-racing-red bg-racing-red/5">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-racing-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-racing-red font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Sync Error State */}
        {syncError && (
          <div className="card mb-8 border-racing-red bg-racing-red/5">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-racing-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-racing-red font-medium">Sync Error: {syncError}</p>
            </div>
          </div>
        )}

        {/* Analytics Table */}
        <div className="card overflow-hidden">
          {analyticsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-racing-blue mx-auto mb-4"></div>
              <p className="text-racing-gray-600">Loading analytics...</p>
            </div>
          ) : filteredAnalytics.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-racing-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-racing-gray-900 mb-2">No Data Available</h3>
              <p className="text-racing-gray-600 mb-4">
                {searchTerm ? 'No results match your search criteria.' : 'No race data found for the selected filters.'}
              </p>
              {!searchTerm && (
                <div className="space-y-2">
                  <button
                    onClick={handleSyncData}
                    disabled={syncLoading}
                    className="btn-primary flex items-center gap-2 w-full"
                  >
                    {syncLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sync Race Data
                      </>
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/debug/sync-debug', { method: 'POST' });
                        const result = await response.json();
                        console.log('Sync Debug Result:', result);
                        alert('Debug info logged to console. Check browser dev tools.');
                      } catch (err) {
                        console.error('Debug error:', err);
                        alert('Debug failed. Check console for errors.');
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-racing-gray-300 rounded-lg hover:bg-racing-gray-50 flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Debug Sync Process
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-racing-gray-50">
                  <tr>
                    {groupBy !== 'track' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-racing-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('seriesName')}
                          className="flex items-center gap-1 hover:text-racing-gray-700"
                        >
                          Series
                          {getSortIcon('seriesName')}
                        </button>
                      </th>
                    )}
                    {groupBy !== 'series' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-racing-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('trackName')}
                          className="flex items-center gap-1 hover:text-racing-gray-700"
                        >
                          Track
                          {getSortIcon('trackName')}
                        </button>
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-racing-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('raceCount')}
                        className="flex items-center gap-1 hover:text-racing-gray-700"
                      >
                        Races
                        {getSortIcon('raceCount')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-racing-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('avgStartingPosition')}
                        className="flex items-center gap-1 hover:text-racing-gray-700"
                      >
                        Avg Start
                        {getSortIcon('avgStartingPosition')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-racing-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('avgFinishingPosition')}
                        className="flex items-center gap-1 hover:text-racing-gray-700"
                      >
                        Avg Finish
                        {getSortIcon('avgFinishingPosition')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-racing-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('positionDelta')}
                        className="flex items-center gap-1 hover:text-racing-gray-700"
                      >
                        Position Δ
                        {getSortIcon('positionDelta')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-racing-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('avgIncidents')}
                        className="flex items-center gap-1 hover:text-racing-gray-700"
                      >
                        Avg Incidents
                        {getSortIcon('avgIncidents')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-racing-gray-200">
                  {filteredAnalytics.map((metric, index) => (
                    <tr key={index} className="hover:bg-racing-gray-50">
                      {groupBy !== 'track' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-racing-gray-900">
                          {metric.seriesName || 'Unknown Series'}
                        </td>
                      )}
                      {groupBy !== 'series' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                          {metric.trackName || 'Unknown Track'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-racing-blue/10 text-racing-blue">
                          {metric.raceCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                        {metric.avgStartingPosition.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                        {metric.avgFinishingPosition.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatDelta(metric.positionDelta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                        <span className={`font-medium ${
                          metric.avgIncidents < 2 ? 'text-racing-green' :
                          metric.avgIncidents < 4 ? 'text-racing-yellow' :
                          'text-racing-red'
                        }`}>
                          {metric.avgIncidents.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredAnalytics.length > 0 && (
          <div className="mt-4 text-sm text-racing-gray-600 text-center">
            Showing {filteredAnalytics.length} of {analytics.length} results
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        )}
      </div>
    </main>
  );
}