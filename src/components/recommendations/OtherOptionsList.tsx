'use client';

import { useState } from 'react';
import { LicenseBadge } from '@/components/ui/LicenseBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { ScoredRecommendation, RecommendationMode } from '@/lib/recommendations/types';

interface OtherOptionsListProps {
  recommendations: ScoredRecommendation[];
  mode: RecommendationMode;
  onSelect?: (recommendation: ScoredRecommendation) => void;
  className?: string;
}

/**
 * Compact list view for recommendations beyond top 3
 * Shows key info in a scannable format
 */
export function OtherOptionsList({
  recommendations,
  mode,
  onSelect,
  className = '',
}: OtherOptionsListProps) {
  const [expanded, setExpanded] = useState(false);

  if (recommendations.length === 0) {
    return null;
  }

  const displayCount = expanded ? recommendations.length : Math.min(5, recommendations.length);
  const displayedRecs = recommendations.slice(0, displayCount);
  const hasMore = recommendations.length > 5;

  // Get the primary score label based on mode
  const getPrimaryScoreLabel = () => {
    switch (mode) {
      case 'irating_push':
        return 'Performance';
      case 'safety_recovery':
        return 'Safety';
      default:
        return 'Score';
    }
  };

  // Get the primary score value based on mode
  const getPrimaryScore = (rec: ScoredRecommendation) => {
    switch (mode) {
      case 'irating_push':
        return rec.score.factors.performance;
      case 'safety_recovery':
        return rec.score.factors.safety;
      default:
        return rec.score.overall;
    }
  };

  return (
    <div className={`bg-white dark:bg-racing-gray-800 rounded-xl border border-racing-gray-200 dark:border-racing-gray-700 ${className}`}>
      <div className="px-4 py-3 border-b border-racing-gray-200 dark:border-racing-gray-700">
        <h3 className="font-semibold text-racing-gray-900 dark:text-white">
          Other Options
        </h3>
        <p className="text-xs text-racing-gray-500 dark:text-racing-gray-400">
          {recommendations.length} more {recommendations.length === 1 ? 'series' : 'series'} available
        </p>
      </div>

      <div className="divide-y divide-racing-gray-100 dark:divide-racing-gray-700">
        {displayedRecs.map((rec, index) => {
          const confidenceLevel =
            rec.score.dataConfidence.performance === 'high' && rec.score.dataConfidence.safety === 'high'
              ? 'high'
              : rec.score.dataConfidence.performance === 'estimated' || rec.score.dataConfidence.safety === 'estimated'
                ? 'estimated'
                : 'no_data';

          return (
            <button
              key={`${rec.seriesId}-${rec.trackId}`}
              onClick={() => onSelect?.(rec)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-racing-gray-50 dark:hover:bg-racing-gray-700/50 transition-colors text-left"
            >
              {/* Rank */}
              <span className="flex-shrink-0 w-6 text-sm font-medium text-racing-gray-400 dark:text-racing-gray-500">
                #{index + 4}
              </span>

              {/* Series & Track */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-racing-gray-900 dark:text-white truncate">
                  {rec.seriesName}
                </p>
                <p className="text-xs text-racing-gray-500 dark:text-racing-gray-400 truncate">
                  @ {rec.trackName}
                </p>
              </div>

              {/* License */}
              <LicenseBadge level={rec.licenseRequired} variant="full" size="sm" />

              {/* Confidence */}
              <ConfidenceBadge level={confidenceLevel} size="sm" />

              {/* Primary Score */}
              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold text-racing-gray-900 dark:text-white">
                  {getPrimaryScore(rec)}
                </p>
                <p className="text-xs text-racing-gray-400 dark:text-racing-gray-500">
                  {getPrimaryScoreLabel()}
                </p>
              </div>

              {/* Chevron */}
              <svg
                className="w-4 h-4 text-racing-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Show more/less */}
      {hasMore && (
        <div className="px-4 py-3 border-t border-racing-gray-200 dark:border-racing-gray-700">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-sm text-racing-blue hover:text-racing-blue/80 font-medium flex items-center justify-center gap-1"
          >
            {expanded ? (
              <>
                Show Less
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                Show {recommendations.length - 5} More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
