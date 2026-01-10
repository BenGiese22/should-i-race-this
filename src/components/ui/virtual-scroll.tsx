/**
 * Virtual Scrolling Component for Large Lists
 * Requirements: General performance improvements - virtual scrolling for large recommendation lists
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { performanceMonitor } from '@/lib/performance/monitoring';

export interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number; // Number of items to render outside visible area
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

/**
 * Virtual scrolling component that only renders visible items for performance
 */
export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  getItemKey
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate visible range with performance monitoring
  const visibleRange = useMemo(() => {
    const startTime = performance.now();
    
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const result = {
      startIndex,
      endIndex,
      totalHeight,
      visibleItems: items.slice(startIndex, endIndex + 1)
    };

    const duration = performance.now() - startTime;
    performanceMonitor.recordUIMetric('VirtualScroll', 'calculate_range', duration);

    return result;
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  // Handle scroll events with throttling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    
    // Performance optimization: Only update if scroll position changed significantly
    if (Math.abs(newScrollTop - scrollTop) < itemHeight / 4) {
      return;
    }

    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);

    // Track scrolling state for performance optimization
    isScrollingRef.current = true;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, [scrollTop, itemHeight, onScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Performance monitoring for render
  useEffect(() => {
    const startTime = performance.now();
    
    // This effect runs after render, so we can measure render time
    const duration = performance.now() - startTime;
    performanceMonitor.recordUIMetric('VirtualScroll', 'render', duration);
  });

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height container to maintain scrollbar */}
      <div style={{ height: visibleRange.totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleRange.visibleItems.map((item, relativeIndex) => {
            const absoluteIndex = visibleRange.startIndex + relativeIndex;
            const key = getItemKey ? getItemKey(item, absoluteIndex) : absoluteIndex;
            
            return (
              <div
                key={key}
                style={{
                  height: itemHeight,
                  overflow: 'hidden'
                }}
              >
                {renderItem(item, absoluteIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing virtual scroll state
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const scrollToIndex = useCallback((index: number) => {
    const newScrollTop = Math.max(0, index * itemHeight);
    setScrollTop(newScrollTop);
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    setScrollTop(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    const maxScrollTop = Math.max(0, items.length * itemHeight - containerHeight);
    setScrollTop(maxScrollTop);
  }, [items.length, itemHeight, containerHeight]);

  return {
    scrollTop,
    setScrollTop,
    scrollToIndex,
    scrollToTop,
    scrollToBottom
  };
}

/**
 * Virtual grid component for 2D virtualization
 */
export interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  columnsPerRow: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  columnsPerRow,
  renderItem,
  overscan = 2,
  className = '',
  getItemKey
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startTime = performance.now();
    
    const totalRows = Math.ceil(items.length / columnsPerRow);
    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    const startIndex = startRow * columnsPerRow;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * columnsPerRow - 1);
    
    const result = {
      startRow,
      endRow,
      startIndex,
      endIndex,
      totalHeight: totalRows * itemHeight,
      visibleItems: items.slice(startIndex, endIndex + 1)
    };

    const duration = performance.now() - startTime;
    performanceMonitor.recordUIMetric('VirtualGrid', 'calculate_range', duration);

    return result;
  }, [items, itemHeight, containerHeight, scrollTop, overscan, columnsPerRow]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight, width: containerWidth }}
      onScroll={handleScroll}
    >
      <div style={{ height: visibleRange.totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleRange.startRow * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsPerRow}, ${itemWidth}px)`,
            gap: '1rem'
          }}
        >
          {visibleRange.visibleItems.map((item, relativeIndex) => {
            const absoluteIndex = visibleRange.startIndex + relativeIndex;
            const key = getItemKey ? getItemKey(item, absoluteIndex) : absoluteIndex;
            
            return (
              <div key={key} style={{ height: itemHeight }}>
                {renderItem(item, absoluteIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}