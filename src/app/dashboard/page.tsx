'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';

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

interface IndividualRace {
  id: string;
  subsessionId: number;
  seriesId: number;
  seriesName: string;
  trackId: number;
  trackName: string;
  raceDate: string;
  startingPosition: number;
  finishingPosition: number;
  positionDelta: number;
  incidents: number;
  strengthOfField: number;
}

type GroupingType = 'series' | 'track' | 'series_track';

// Helper to create a unique key for each metric row
const getMetricKey = (metric: PerformanceMetric, groupBy: GroupingType): string => {
  if (groupBy === 'series') return `series-${metric.seriesId}`;
  if (groupBy === 'track') return `track-${metric.trackId}`;
  return `series-${metric.seriesId}-track-${metric.trackId}`;
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<PerformanceMetric[]>([]);
  const [filteredAnalytics, setFilteredAnalytics] = useState<PerformanceMetric[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [groupBy, setGroupBy] = useState<GroupingType>('series');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof PerformanceMetric>('raceCount');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Expandable row states
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedRowData, setExpandedRowData] = useState<Record<string, IndividualRace[]>>({});
  const [expandedRowLoading, setExpandedRowLoading] = useState<Set<string>>(new Set());

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
      const params = new URLSearchParams({ groupBy });

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
  }, [user, groupBy]);

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
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [analytics, searchTerm, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAnalytics.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAnalytics = filteredAnalytics.slice(startIndex, endIndex);

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Toggle row expansion and fetch individual race data
  const toggleRowExpansion = async (metric: PerformanceMetric) => {
    const key = getMetricKey(metric, groupBy);

    if (expandedRows.has(key)) {
      // Collapse the row
      const newExpanded = new Set(expandedRows);
      newExpanded.delete(key);
      setExpandedRows(newExpanded);
      return;
    }

    // Expand the row
    const newExpanded = new Set(expandedRows);
    newExpanded.add(key);
    setExpandedRows(newExpanded);

    // If we already have data, don't fetch again
    if (expandedRowData[key]) {
      return;
    }

    // Fetch individual race data
    const newLoading = new Set(expandedRowLoading);
    newLoading.add(key);
    setExpandedRowLoading(newLoading);

    try {
      const params = new URLSearchParams();
      if (metric.seriesId) params.set('seriesId', metric.seriesId.toString());
      if (metric.trackId) params.set('trackId', metric.trackId.toString());

      const response = await fetch(`/api/data/analytics/races?${params}`);
      if (!response.ok) throw new Error('Failed to fetch race details');

      const data = await response.json();
      setExpandedRowData(prev => ({ ...prev, [key]: data.races || [] }));
    } catch (err) {
      console.error('Failed to fetch race details:', err);
      // Remove from expanded on error
      const revertExpanded = new Set(expandedRows);
      revertExpanded.delete(key);
      setExpandedRows(revertExpanded);
    } finally {
      const doneLoading = new Set(expandedRowLoading);
      doneLoading.delete(key);
      setExpandedRowLoading(doneLoading);
    }
  };

  // Clear expanded rows when groupBy changes
  useEffect(() => {
    setExpandedRows(new Set());
    setExpandedRowData({});
  }, [groupBy]);

  // Fetch data when filters change
  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, groupBy, fetchAnalytics]);

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

  const formatDelta = (delta: number, decimals: number = 1) => {
    if (delta > 0) {
      return <span className="text-racing-improvement font-semibold">+{delta.toFixed(decimals)}</span>;
    } else if (delta < 0) {
      return <span className="text-racing-decline font-semibold">{delta.toFixed(decimals)}</span>;
    } else {
      return <span className="text-racing-neutral">0{decimals > 0 ? '.0' : ''}</span>;
    }
  };

  // Get incident color class based on incident count
  // More gradual scale since incidents are common in racing
  const getIncidentColor = (incidents: number): string => {
    if (incidents <= 1) return 'text-emerald-600';     // Excellent - very clean race
    if (incidents <= 2) return 'text-teal-500';        // Very good
    if (incidents <= 4) return 'text-amber-500';       // Average - typical racing incidents
    if (incidents <= 6) return 'text-orange-500';      // Concerning
    return 'text-red-600';                              // High incidents
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Group By Dropdown */}
            <div>
              <label className="block text-sm font-medium text-racing-gray-700 mb-2">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupingType)}
                className="w-full px-3 py-2 border border-racing-gray-300 rounded-lg focus:ring-2 focus:ring-racing-blue focus:border-transparent"
              >
                <option value="series">Series</option>
                <option value="track">Track</option>
                <option value="series_track">Series + Track</option>
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

            {/* Sync Button */}
            <div className="flex items-end">
              <div className="relative group">
                <button
                  onClick={handleSyncData}
                  disabled={syncLoading || analyticsLoading}
                  className="px-3 py-2 bg-racing-blue text-white rounded-lg hover:bg-racing-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {syncLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Sync</span>
                    </>
                  )}
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-racing-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Fetch latest race data from iRacing
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-racing-gray-900"></div>
                </div>
              </div>
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
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={handleSyncData}
                    disabled={syncLoading}
                    className="px-4 py-2 bg-racing-blue text-white rounded-lg hover:bg-racing-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {syncLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Syncing from iRacing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Sync Race Data from iRacing
                      </>
                    )}
                  </button>
                  <p className="text-xs text-racing-gray-500">
                    This will fetch your latest race results from iRacing
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-racing-gray-50">
                  <tr>
                    {/* Expand indicator column */}
                    <th className="w-8"></th>
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
                  {paginatedAnalytics.map((metric, index) => {
                    const rowKey = getMetricKey(metric, groupBy);
                    const isExpanded = expandedRows.has(rowKey);
                    const isLoading = expandedRowLoading.has(rowKey);
                    const raceDetails = expandedRowData[rowKey] || [];
                    const colSpan = groupBy === 'series_track' ? 7 : 6;

                    return (
                      <React.Fragment key={startIndex + index}>
                        {/* Main aggregated row */}
                        <tr
                          onClick={() => toggleRowExpansion(metric)}
                          className="hover:bg-racing-gray-50 cursor-pointer select-none"
                        >
                          {/* Expand indicator */}
                          <td className="pl-4 pr-2 py-4 w-8">
                            <svg
                              className={`w-4 h-4 text-racing-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </td>
                          {groupBy !== 'track' && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-racing-gray-900">
                              {metric.seriesName || 'Unknown Series'}
                            </td>
                          )}
                          {groupBy !== 'series' && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                              {metric.trackName || 'Unknown Track'}
                            </td>
                          )}
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-racing-blue/10 text-racing-blue">
                              {metric.raceCount}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                            {metric.avgStartingPosition.toFixed(1)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                            {metric.avgFinishingPosition.toFixed(1)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {formatDelta(metric.positionDelta)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-racing-gray-900">
                            <span className={`font-medium ${getIncidentColor(metric.avgIncidents)}`}>
                              {metric.avgIncidents.toFixed(1)}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={colSpan + 1} className="px-4 py-0 bg-racing-gray-50">
                              <div className="py-3">
                                {isLoading ? (
                                  <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-racing-blue"></div>
                                    <span className="ml-2 text-sm text-racing-gray-600">Loading race details...</span>
                                  </div>
                                ) : raceDetails.length === 0 ? (
                                  <div className="text-center py-4 text-sm text-racing-gray-500">
                                    No individual race data found
                                  </div>
                                ) : (
                                  <div className="max-h-52 overflow-y-auto border border-racing-gray-200 rounded-lg bg-white">
                                    <table className="w-full text-sm">
                                      <thead className="bg-racing-gray-100 sticky top-0">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-racing-gray-500 uppercase">Date</th>
                                          {groupBy === 'series' && (
                                            <th className="px-3 py-2 text-left text-xs font-medium text-racing-gray-500 uppercase">Track</th>
                                          )}
                                          {groupBy === 'track' && (
                                            <th className="px-3 py-2 text-left text-xs font-medium text-racing-gray-500 uppercase">Series</th>
                                          )}
                                          <th className="px-3 py-2 text-left text-xs font-medium text-racing-gray-500 uppercase">Start</th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-racing-gray-500 uppercase">Finish</th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-racing-gray-500 uppercase">Δ</th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-racing-gray-500 uppercase">Inc</th>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-racing-gray-500 uppercase">SOF</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-racing-gray-100">
                                        {raceDetails.map((race) => (
                                          <tr key={race.subsessionId} className="hover:bg-racing-gray-50">
                                            <td className="px-3 py-2 text-racing-gray-700 whitespace-nowrap">{formatDateTime(race.raceDate)}</td>
                                            {groupBy === 'series' && (
                                              <td className="px-3 py-2 text-racing-gray-700 max-w-[200px] truncate" title={race.trackName}>
                                                {race.trackName}
                                              </td>
                                            )}
                                            {groupBy === 'track' && (
                                              <td className="px-3 py-2 text-racing-gray-700 max-w-[200px] truncate" title={race.seriesName}>
                                                {race.seriesName}
                                              </td>
                                            )}
                                            <td className="px-3 py-2 text-racing-gray-900">{race.startingPosition > 0 ? `P${race.startingPosition}` : '-'}</td>
                                            <td className="px-3 py-2 text-racing-gray-900">{race.finishingPosition > 0 ? `P${race.finishingPosition}` : '-'}</td>
                                            <td className="px-3 py-2">{race.startingPosition > 0 && race.finishingPosition > 0 ? formatDelta(race.positionDelta, 0) : '-'}</td>
                                            <td className="px-3 py-2">
                                              <span className={getIncidentColor(race.incidents)}>
                                                {race.incidents}x
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 text-racing-gray-600">{race.strengthOfField && race.strengthOfField > 0 ? race.strengthOfField.toLocaleString() : '-'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredAnalytics.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Results Summary */}
            <div className="text-sm text-racing-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAnalytics.length)} of {filteredAnalytics.length} results
              {searchTerm && ` for "${searchTerm}"`}
              {filteredAnalytics.length !== analytics.length && ` (${analytics.length} total)`}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-4">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-racing-gray-600">
                  Rows:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-racing-gray-300 rounded focus:ring-2 focus:ring-racing-blue focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page Navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-racing-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="First page"
                  >
                    <svg className="w-5 h-5 text-racing-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-racing-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                  >
                    <svg className="w-5 h-5 text-racing-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Indicator */}
                  <span className="px-3 py-1 text-sm text-racing-gray-700">
                    {currentPage} / {totalPages}
                  </span>

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-racing-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next page"
                  >
                    <svg className="w-5 h-5 text-racing-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-racing-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Last page"
                  >
                    <svg className="w-5 h-5 text-racing-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}