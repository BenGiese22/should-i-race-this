/**
 * Performance Monitoring Middleware for API Routes
 * Requirements: General performance improvements - performance monitoring for production deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from './monitoring';
import { globalProfiler } from './profiler';

export interface PerformanceMiddlewareOptions {
  enableProfiling?: boolean;
  enableMetrics?: boolean;
  slowRequestThreshold?: number; // ms
  enableRequestLogging?: boolean;
}

/**
 * Middleware wrapper for API routes to add performance monitoring
 */
export function withPerformanceMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: PerformanceMiddlewareOptions = {}
) {
  const {
    enableProfiling = true,
    enableMetrics = true,
    slowRequestThreshold = 1000,
    enableRequestLogging = process.env.NODE_ENV === 'development'
  } = options;

  return async function performanceWrapper(request: NextRequest): Promise<NextResponse> {
    const startTime = performance.now();
    const url = new URL(request.url);
    const method = request.method;
    const endpoint = url.pathname;
    
    // Generate unique request ID for tracing
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (enableRequestLogging) {
      console.log(`[${requestId}] ${method} ${endpoint} - Started`);
    }

    let response: NextResponse;
    let statusCode = 200;
    let error: Error | null = null;

    try {
      if (enableProfiling) {
        // Use profiler for detailed timing
        const { result } = await globalProfiler.profile(
          `api_${method}_${endpoint.replace(/\//g, '_')}`,
          () => handler(request),
          { 
            requestId, 
            endpoint, 
            method,
            userAgent: request.headers.get('user-agent'),
            contentLength: request.headers.get('content-length')
          }
        );
        response = result;
      } else {
        // Simple execution without profiling
        response = await handler(request);
      }

      statusCode = response.status;
    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error');
      statusCode = 500;
      
      // Create error response
      response = NextResponse.json(
        { 
          error: 'Internal server error',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Record metrics
    if (enableMetrics) {
      performanceMonitor.recordApiMetric(endpoint, method, duration, statusCode);
      
      // Record additional metrics for slow requests
      if (duration > slowRequestThreshold) {
        performanceMonitor.recordMetric(
          'slow_request',
          duration,
          'ms',
          'api',
          {
            endpoint,
            method,
            status: statusCode.toString(),
            requestId,
            threshold: slowRequestThreshold.toString()
          }
        );
      }
    }

    // Log completion
    if (enableRequestLogging) {
      const logLevel = error ? 'error' : duration > slowRequestThreshold ? 'warn' : 'log';
      console[logLevel](
        `[${requestId}] ${method} ${endpoint} - ${statusCode} (${duration.toFixed(2)}ms)`,
        error ? { error: error.message } : {}
      );
    }

    // Add performance headers to response
    const headers = new Headers(response.headers);
    headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
    headers.set('X-Request-ID', requestId);
    
    if (process.env.NODE_ENV === 'development') {
      headers.set('X-Performance-Profile', enableProfiling ? 'enabled' : 'disabled');
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  };
}

/**
 * Middleware for database operations
 */
export function withDatabaseMonitoring<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  operationName: string
) {
  return async function databaseWrapper(...args: T): Promise<R> {
    const startTime = performance.now();
    
    try {
      const result = await operation(...args);
      const duration = performance.now() - startTime;
      
      // Estimate row count for arrays
      const rowCount = Array.isArray(result) ? result.length : undefined;
      
      performanceMonitor.recordDatabaseMetric(operationName, duration, rowCount);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      performanceMonitor.recordDatabaseMetric(operationName, duration);
      performanceMonitor.recordMetric(
        'database_error',
        1,
        'count',
        'database',
        {
          operation: operationName,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
      
      throw error;
    }
  };
}

/**
 * Middleware for cache operations
 */
export function withCacheMonitoring<T>(
  operation: () => T,
  cacheKey: string,
  operationType: 'get' | 'set' | 'delete'
) {
  return function cacheWrapper(): T {
    const startTime = performance.now();
    
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      
      // Determine if it was a hit or miss for get operations
      const metricType = operationType === 'get' 
        ? (result ? 'hit' : 'miss')
        : 'set';
      
      performanceMonitor.recordCacheMetric(metricType, 'recommendation');
      
      // Record timing for cache operations
      performanceMonitor.recordMetric(
        'cache_operation_time',
        duration,
        'ms',
        'cache',
        {
          operation: operationType,
          cacheKey: cacheKey.substring(0, 50), // Truncate long keys
          hit: result ? 'true' : 'false'
        }
      );
      
      return result;
    } catch (error) {
      performanceMonitor.recordMetric(
        'cache_error',
        1,
        'count',
        'cache',
        {
          operation: operationType,
          cacheKey: cacheKey.substring(0, 50),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
      
      throw error;
    }
  };
}

/**
 * React component performance monitoring HOC
 */
export function withComponentMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  return function MonitoredComponent(props: P) {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.recordUIMetric(displayName, 'mount', renderTime);
    }, []);
    
    React.useEffect(() => {
      const updateStartTime = performance.now();
      
      return () => {
        const updateTime = performance.now() - updateStartTime;
        performanceMonitor.recordUIMetric(displayName, 'update', updateTime);
      };
    });
    
    return React.createElement(Component, props);
  };
}

/**
 * Performance monitoring hook for React components
 */
export function usePerformanceTracking(componentName: string) {
  const [renderCount, setRenderCount] = React.useState(0);
  const mountTimeRef = React.useRef<number>(performance.now());
  
  React.useEffect(() => {
    setRenderCount(prev => prev + 1);
  });
  
  React.useEffect(() => {
    const mountTime = performance.now() - mountTimeRef.current;
    performanceMonitor.recordUIMetric(componentName, 'mount', mountTime);
    
    return () => {
      const totalLifetime = performance.now() - mountTimeRef.current;
      performanceMonitor.recordUIMetric(componentName, 'unmount', totalLifetime);
      
      // Record render count
      performanceMonitor.recordMetric(
        'component_render_count',
        renderCount,
        'count',
        'ui',
        { component: componentName }
      );
    };
  }, [componentName, renderCount]);
  
  const trackOperation = React.useCallback((operationName: string, operation: () => void) => {
    const startTime = performance.now();
    operation();
    const duration = performance.now() - startTime;
    
    performanceMonitor.recordUIMetric(componentName, operationName, duration);
  }, [componentName]);
  
  return {
    renderCount,
    trackOperation
  };
}

// Re-export React for the hook
import React from 'react';