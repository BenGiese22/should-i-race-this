/**
 * Performance Dashboard Component for Production Monitoring
 * Requirements: General performance improvements - performance monitoring for production deployment
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PerformanceMetrics {
  api: { avg: number; p95: number; count: number };
  cache: { hitRate: number; operations: number };
  database: { avg: number; p95: number; count: number };
  ui: { avg: number; p95: number; count: number };
}

interface PerformanceAlert {
  metric: string;
  level: 'warning' | 'critical';
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

interface PerformanceData {
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  timeRange: { start: number; end: number };
}

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState(5); // minutes

  const fetchPerformanceData = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/performance?action=summary&minutes=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const runBenchmark = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'benchmark', iterations: 3 })
      });
      
      if (!response.ok) {
        throw new Error(`Benchmark failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Benchmark results:', result);
      
      // Refresh data after benchmark
      await fetchPerformanceData();
    } catch (err) {
      console.error('Benchmark error:', err);
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      });
      
      if (!response.ok) {
        throw new Error(`Clear cache failed: ${response.statusText}`);
      }
      
      // Refresh data after clearing cache
      await fetchPerformanceData();
    } catch (err) {
      console.error('Clear cache error:', err);
      setError(err instanceof Error ? err.message : 'Clear cache failed');
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

  const formatDuration = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, thresholds: { warning: number; critical: number }): string => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCacheHealthColor = (hitRate: number): string => {
    if (hitRate >= 0.8) return 'text-green-600';
    if (hitRate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-600 text-lg mb-2">Performance Monitoring Error</div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <Button onClick={fetchPerformanceData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">No performance data available</div>
        </CardContent>
      </Card>
    );
  }

  const { metrics, alerts } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-sm text-gray-600">
            Real-time performance monitoring for the last {timeRange} minutes
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 text-sm border rounded-md"
          >
            <option value={5}>Last 5 minutes</option>
            <option value={15}>Last 15 minutes</option>
            <option value={30}>Last 30 minutes</option>
            <option value={60}>Last hour</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={runBenchmark}
            disabled={loading}
          >
            Run Benchmark
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            disabled={loading}
          >
            Clear Cache
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPerformanceData}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Performance Alerts
              <Badge variant="destructive">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md border ${
                    alert.level === 'critical' 
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{alert.message}</div>
                    <Badge variant={alert.level === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.level}
                    </Badge>
                  </div>
                  <div className="text-xs mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* API Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">API Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Average Response</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(metrics.api.avg, { warning: 500, critical: 1000 })}`}>
                    {formatDuration(metrics.api.avg)}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">95th Percentile</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(metrics.api.p95, { warning: 1000, critical: 2000 })}`}>
                    {formatDuration(metrics.api.p95)}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Requests</span>
                  <span className="text-sm font-medium">{metrics.api.count}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cache Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600">Hit Rate</span>
                  <span className={`text-sm font-medium ${getCacheHealthColor(metrics.cache.hitRate)}`}>
                    {(metrics.cache.hitRate * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={metrics.cache.hitRate * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Operations</span>
                  <span className="text-sm font-medium">{metrics.cache.operations}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Database Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Average Query</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(metrics.database.avg, { warning: 200, critical: 500 })}`}>
                    {formatDuration(metrics.database.avg)}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">95th Percentile</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(metrics.database.p95, { warning: 500, critical: 1000 })}`}>
                    {formatDuration(metrics.database.p95)}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Queries</span>
                  <span className="text-sm font-medium">{metrics.database.count}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UI Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">UI Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Average Render</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(metrics.ui.avg, { warning: 50, critical: 100 })}`}>
                    {formatDuration(metrics.ui.avg)}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">95th Percentile</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(metrics.ui.p95, { warning: 100, critical: 200 })}`}>
                    {formatDuration(metrics.ui.p95)}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Operations</span>
                  <span className="text-sm font-medium">{metrics.ui.count}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performance Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">API Optimization</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Enable caching for frequently accessed data</li>
                <li>• Use batch processing for multiple requests</li>
                <li>• Implement request debouncing</li>
                <li>• Optimize database queries</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">UI Optimization</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Use virtual scrolling for large lists</li>
                <li>• Implement component memoization</li>
                <li>• Lazy load non-critical components</li>
                <li>• Optimize re-render cycles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}