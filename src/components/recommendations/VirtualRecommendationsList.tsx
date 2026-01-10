/**
 * Virtual Scrolling Recommendations List for Performance Optimization
 * Requirements: General performance improvements - virtual scrolling for large recommendation lists
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { VirtualScroll, VirtualGrid } from '@/components/ui/virtual-scroll';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationTable } from './RecommendationTable';
import { Card, CardContent } from '@/components/ui/card';
import { ScoredRecommendation } from '@/lib/recommendations/types';
import { performanceMonitor } from '@/lib/performance/monitoring';

interface VirtualRecommendationsListProps {
  recommendations: ScoredRecommendation[];
  viewMode: 'cards' | 'table';
  onSelect: (recommendation: ScoredRecommendation) => void;
  containerHeight?: number;
  enableVirtualization?: boolean;
  virtualizationThreshold?: number;
}

// Constants for virtual scrolling
const CARD_HEIGHT = 280; // Approximate height of a recommendation card
const TABLE_ROW_HEIGHT = 60; // Height of a table row
const CARDS_PER_ROW_DESKTOP = 3;
const CARDS_PER_ROW_TABLET = 2;
const CARDS_PER_ROW_MOBILE = 1;

export function VirtualRecommendationsList({
  recommendations,
  viewMode,
  onSelect,
  containerHeight = 600,
  enableVirtualization = true,
  virtualizationThreshold = 50
}: VirtualRecommendationsListProps) {
  // Determine if we should use virtualization
  const shouldVirtualize = useMemo(() => {
    return enableVirtualization && recommendations.length > virtualizationThreshold;
  }, [enableVirtualization, recommendations.length, virtualizationThreshold]);

  // Get screen size for responsive grid
  const getColumnsPerRow = useCallback(() => {
    if (typeof window === 'undefined') return CARDS_PER_ROW_DESKTOP;
    
    const width = window.innerWidth;
    if (width < 768) return CARDS_PER_ROW_MOBILE;
    if (width < 1024) return CARDS_PER_ROW_TABLET;
    return CARDS_PER_ROW_DESKTOP;
  }, []);

  // Render individual recommendation card
  const renderCard = useCallback((recommendation: ScoredRecommendation, _index: number) => {
    const startTime = performance.now();
    
    const card = (
      <RecommendationCard
        key={`${recommendation.seriesId}-${recommendation.trackId}-${recommendation.raceWeekNum}`}
        recommendation={recommendation}
        onSelect={onSelect}
      />
    );

    const duration = performance.now() - startTime;
    performanceMonitor.recordUIMetric('RecommendationCard', 'render', duration);

    return card;
  }, [onSelect]);

  // Render table row (for virtual table)
  const renderTableRow = useCallback((recommendation: ScoredRecommendation, _index: number) => {
    const startTime = performance.now();
    
    const row = (
      <tr
        key={`${recommendation.seriesId}-${recommendation.trackId}-${recommendation.raceWeekNum}`}
        className="hover:bg-gray-50 cursor-pointer border-b"
        onClick={() => onSelect(recommendation)}
      >
        <td className="px-4 py-3">
          <div className="font-medium text-sm">{recommendation.seriesName}</div>
          <div className="text-xs text-gray-500">{recommendation.trackName}</div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-sm font-medium">{Math.round(recommendation.score.overall)}</div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-xs text-gray-600">{recommendation.category.replace('_', ' ').toUpperCase()}</div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-xs">{recommendation.licenseRequired}</div>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-xs">{recommendation.setupType || 'Open'}</div>
        </td>
      </tr>
    );

    const duration = performance.now() - startTime;
    performanceMonitor.recordUIMetric('RecommendationTableRow', 'render', duration);

    return row;
  }, [onSelect]);

  // Get unique key for items
  const getItemKey = useCallback((recommendation: ScoredRecommendation, _index: number) => {
    return `${recommendation.seriesId}-${recommendation.trackId}-${recommendation.raceWeekNum}`;
  }, []);

  // Handle empty state
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500 text-lg mb-2">
            No recommendations available
          </div>
          <div className="text-gray-400 text-sm">
            Try adjusting your filters or check back after more race data is available.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render cards view
  if (viewMode === 'cards') {
    if (shouldVirtualize) {
      const columnsPerRow = getColumnsPerRow();
      const cardWidth = Math.floor((window?.innerWidth || 1200) / columnsPerRow) - 32; // Account for gaps
      
      return (
        <div className="w-full">
          <div className="mb-4 text-sm text-gray-600">
            Showing {recommendations.length} recommendations (virtualized for performance)
          </div>
          <VirtualGrid
            items={recommendations}
            itemWidth={cardWidth}
            itemHeight={CARD_HEIGHT}
            containerWidth={window?.innerWidth || 1200}
            containerHeight={containerHeight}
            columnsPerRow={columnsPerRow}
            renderItem={renderCard}
            getItemKey={getItemKey}
            className="border rounded-lg"
            overscan={2}
          />
        </div>
      );
    } else {
      // Regular grid for smaller lists
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((recommendation, index) => renderCard(recommendation, index))}
        </div>
      );
    }
  }

  // Render table view
  if (shouldVirtualize) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="mb-4 p-4 text-sm text-gray-600">
            Showing {recommendations.length} recommendations (virtualized for performance)
          </div>
          <div className="overflow-hidden">
            {/* Table header */}
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Series & Track
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Setup
                  </th>
                </tr>
              </thead>
            </table>
            
            {/* Virtual scrolling table body */}
            <VirtualScroll
              items={recommendations}
              itemHeight={TABLE_ROW_HEIGHT}
              containerHeight={containerHeight - 60} // Account for header
              renderItem={(recommendation, index) => (
                <table className="w-full">
                  <tbody>
                    {renderTableRow(recommendation, index)}
                  </tbody>
                </table>
              )}
              getItemKey={getItemKey}
              className="border-t"
            />
          </div>
        </CardContent>
      </Card>
    );
  } else {
    // Regular table for smaller lists
    return (
      <Card>
        <CardContent className="p-0">
          <RecommendationTable
            recommendations={recommendations}
            onSelect={onSelect}
          />
        </CardContent>
      </Card>
    );
  }
}

/**
 * Hook for managing virtual recommendations list state
 */
export function useVirtualRecommendationsList(
  recommendations: ScoredRecommendation[],
  containerHeight: number = 600
) {
  const shouldVirtualize = useMemo(() => {
    return recommendations.length > 50;
  }, [recommendations.length]);

  const performanceStats = useMemo(() => {
    const startTime = performance.now();
    
    const stats = {
      totalItems: recommendations.length,
      shouldVirtualize,
      estimatedMemorySaving: shouldVirtualize 
        ? `${Math.round((recommendations.length - 20) * 0.1)}KB` // Rough estimate
        : '0KB',
      renderStrategy: shouldVirtualize ? 'virtual' : 'full'
    };

    const duration = performance.now() - startTime;
    performanceMonitor.recordUIMetric('VirtualRecommendationsList', 'calculate_stats', duration);

    return stats;
  }, [recommendations.length, shouldVirtualize]);

  return {
    shouldVirtualize,
    performanceStats,
    containerHeight
  };
}