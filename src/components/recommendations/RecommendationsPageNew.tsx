'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ModePillSelector } from './ModePillSelector';
import { CategoryDropdown } from './CategoryDropdown';
import { RecommendationCard } from './RecommendationCard';
import { OtherOptionsList } from './OtherOptionsList';
import { RecommendationDetails } from './RecommendationDetails';
import { useRecommendations } from '@/lib/hooks';
import type { ScoredRecommendation, RecommendationMode, Category } from '@/lib/recommendations/types';

interface RecommendationsPageNewProps {
  initialMode?: RecommendationMode;
}

interface SyncStatus {
  lastSyncAt: string | null;
  totalRaces: number;
}

/**
 * Format a date as relative time (e.g., "5 minutes ago", "2 hours ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * New recommendations page with clean, focused design
 *
 * Features:
 * - Mode selector (always visible pill toggle)
 * - Category tabs (auto-detected from user's racing history)
 * - Primary recommendation (#1) prominently displayed
 * - Secondary recommendations (#2, #3)
 * - Other options list for remaining
 * - Empty/low data states
 * - Sync button with last synced timestamp
 */
export function RecommendationsPageNew({ initialMode = 'balanced' }: RecommendationsPageNewProps) {
  const [mode, setMode] = useState<RecommendationMode>(initialMode);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ScoredRecommendation | null>(null);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Fetch recommendations
  const { data, loading, error, isRetrying, refetch } = useRecommendations({
    mode,
    category: selectedCategory || undefined,
    maxResults: 50,
    includeAlmostEligible: false,
  });

  // Fetch sync status on mount
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const response = await fetch('/api/data/sync');
        if (response.ok) {
          const data = await response.json();
          setSyncStatus(data.syncStatus);
        }
      } catch (err) {
        console.error('Failed to fetch sync status:', err);
      }
    };
    fetchSyncStatus();
  }, []);

  // Handle sync
  const handleSync = useCallback(async () => {
    setSyncLoading(true);
    setSyncError(null);

    try {
      const response = await fetch('/api/data/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        setSyncStatus(result.syncStatus);
        // Refetch recommendations after sync
        await refetch();
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSyncLoading(false);
    }
  }, [refetch]);

  // Extract user's categories from their license classes
  const userCategories = useMemo(() => {
    if (!data?.userProfile?.licenseClasses) return [];
    return data.userProfile.licenseClasses.map((lc) => lc.category);
  }, [data?.userProfile?.licenseClasses]);

  // Set default category to user's primary
  const effectiveCategory = selectedCategory || data?.userProfile?.primaryCategory || 'sports_car';

  // Handle category change
  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
  };

  // Get recommendations for current category
  const recommendations = data?.recommendations || [];
  const primaryRecommendation = recommendations[0];
  const secondaryRecommendations = recommendations.slice(1, 3);
  const otherRecommendations = recommendations.slice(3);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <ErrorState error={error} onRetry={refetch} isRetrying={isRetrying} />
      </div>
    );
  }

  // No data state (user hasn't raced enough)
  if (recommendations.length === 0 && !loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Mode and Category selectors - mode on left, category on right */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <ModePillSelector
            currentMode={mode}
            onModeChange={setMode}
            disabled={loading}
          />

          {userCategories.length > 0 && (
            <CategoryDropdown
              categories={userCategories}
              currentCategory={effectiveCategory}
              onCategoryChange={handleCategoryChange}
              primaryCategory={data?.userProfile?.primaryCategory}
              disabled={loading}
            />
          )}
        </div>

        <EmptyState
          category={effectiveCategory}
          hasAnyData={data?.userProfile?.experienceSummary?.totalRaces > 0}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header with sync */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-racing-gray-900 dark:text-white">
            What Should I Race?
          </h1>
          <p className="text-racing-gray-600 dark:text-racing-gray-400 mt-1">
            Personalized recommendations based on your racing history
          </p>
        </div>

        {/* Sync button and status */}
        <div className="flex flex-col items-end gap-1">
          <div className="relative group">
            <button
              onClick={handleSync}
              disabled={syncLoading || loading}
              className="px-3 py-2 bg-racing-blue text-white rounded-lg hover:bg-racing-blue/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {syncLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-racing-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Fetch latest race data from iRacing
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-racing-gray-900" />
            </div>
          </div>
          {/* Last synced timestamp */}
          {syncStatus?.lastSyncAt && (
            <p className="text-xs text-racing-gray-500 dark:text-racing-gray-400">
              Last synced: {formatRelativeTime(syncStatus.lastSyncAt)}
            </p>
          )}
          {syncError && (
            <p className="text-xs text-red-500">{syncError}</p>
          )}
        </div>
      </div>

      {/* Mode and Category selectors - mode on left, category on right */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <ModePillSelector
          currentMode={mode}
          onModeChange={setMode}
          disabled={loading}
        />

        {userCategories.length > 0 && (
          <CategoryDropdown
            categories={userCategories}
            currentCategory={effectiveCategory}
            onCategoryChange={handleCategoryChange}
            primaryCategory={data?.userProfile?.primaryCategory}
            disabled={loading}
          />
        )}
      </div>

      {/* Experience summary (subtle context) */}
      {data?.userProfile?.experienceSummary && (
        <div className="flex items-center gap-4 text-sm text-racing-gray-500 dark:text-racing-gray-400">
          <span>Based on {data.userProfile.experienceSummary.totalRaces} races</span>
          <span className="text-racing-gray-300 dark:text-racing-gray-600">•</span>
          <span>{data.userProfile.experienceSummary.seriesWithExperience} series</span>
          <span className="text-racing-gray-300 dark:text-racing-gray-600">•</span>
          <span>{data.userProfile.experienceSummary.tracksWithExperience} tracks</span>
        </div>
      )}

      {/* Primary recommendation (#1) */}
      {primaryRecommendation && (
        <section>
          <h2 className="text-sm font-semibold text-racing-gray-500 dark:text-racing-gray-400 uppercase tracking-wide mb-4">
            Top Pick for You
          </h2>
          <RecommendationCard
            recommendation={primaryRecommendation}
            rank={1}
            mode={mode}
            variant="primary"
          />
        </section>
      )}

      {/* Secondary recommendations (#2, #3) */}
      {secondaryRecommendations.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-racing-gray-500 dark:text-racing-gray-400 uppercase tracking-wide mb-4">
            Also Great Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secondaryRecommendations.map((rec, index) => (
              <RecommendationCard
                key={`${rec.seriesId}-${rec.trackId}`}
                recommendation={rec}
                rank={index + 2}
                mode={mode}
                variant="secondary"
              />
            ))}
          </div>
        </section>
      )}

      {/* Other options */}
      {otherRecommendations.length > 0 && (
        <section>
          <OtherOptionsList
            recommendations={otherRecommendations}
            mode={mode}
            onSelect={setSelectedRecommendation}
          />
        </section>
      )}

      {/* Detailed view modal */}
      {selectedRecommendation && (
        <DetailModal
          recommendation={selectedRecommendation}
          mode={mode}
          onClose={() => setSelectedRecommendation(null)}
        />
      )}
    </div>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-8 bg-racing-gray-200 dark:bg-racing-gray-700 rounded w-64 mb-2" />
        <div className="h-4 bg-racing-gray-200 dark:bg-racing-gray-700 rounded w-96" />
      </div>

      {/* Mode selector skeleton */}
      <div className="flex gap-2">
        <div className="h-10 bg-racing-gray-200 dark:bg-racing-gray-700 rounded-lg w-32" />
        <div className="h-10 bg-racing-gray-200 dark:bg-racing-gray-700 rounded-lg w-32" />
        <div className="h-10 bg-racing-gray-200 dark:bg-racing-gray-700 rounded-lg w-40" />
      </div>

      {/* Category tabs skeleton */}
      <div className="flex gap-4 border-b border-racing-gray-200 dark:border-racing-gray-700 pb-2">
        <div className="h-8 bg-racing-gray-200 dark:bg-racing-gray-700 rounded w-24" />
        <div className="h-8 bg-racing-gray-200 dark:bg-racing-gray-700 rounded w-28" />
        <div className="h-8 bg-racing-gray-200 dark:bg-racing-gray-700 rounded w-24" />
      </div>

      {/* Primary card skeleton */}
      <div className="h-64 bg-racing-gray-200 dark:bg-racing-gray-700 rounded-xl" />

      {/* Secondary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-racing-gray-200 dark:bg-racing-gray-700 rounded-xl" />
        <div className="h-48 bg-racing-gray-200 dark:bg-racing-gray-700 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Error state
 */
function ErrorState({
  error,
  onRetry,
  isRetrying,
}: {
  error: Error;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="bg-white dark:bg-racing-gray-800 rounded-xl border border-racing-gray-200 dark:border-racing-gray-700 p-8 text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-racing-gray-900 dark:text-white mb-2">
        Something went wrong
      </h2>
      <p className="text-racing-gray-600 dark:text-racing-gray-400 mb-4">
        {error.message || 'Unable to load recommendations. Please try again.'}
      </p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="px-4 py-2 bg-racing-blue text-white rounded-lg font-medium hover:bg-racing-blue/90 disabled:opacity-50"
      >
        {isRetrying ? 'Retrying...' : 'Try Again'}
      </button>
    </div>
  );
}

/**
 * Empty state - when no recommendations available
 */
function EmptyState({
  category,
  hasAnyData,
}: {
  category: Category;
  hasAnyData: boolean;
}) {
  const categoryLabels: Record<Category, string> = {
    oval: 'Oval',
    sports_car: 'Sports Car',
    formula_car: 'Formula',
    dirt_oval: 'Dirt Oval',
    dirt_road: 'Dirt Road',
  };

  return (
    <div className="bg-white dark:bg-racing-gray-800 rounded-xl border border-racing-gray-200 dark:border-racing-gray-700 p-8 text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-racing-gray-100 dark:bg-racing-gray-700 flex items-center justify-center">
        <svg className="w-6 h-6 text-racing-gray-500 dark:text-racing-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-racing-gray-900 dark:text-white mb-2">
        {hasAnyData
          ? `No ${categoryLabels[category]} Recommendations Yet`
          : 'Get Started Racing!'
        }
      </h2>
      <p className="text-racing-gray-600 dark:text-racing-gray-400 mb-4 max-w-md mx-auto">
        {hasAnyData
          ? `We need more race data in ${categoryLabels[category]} to give you personalized recommendations. Complete a few races and check back!`
          : 'Complete a few races in iRacing and we\'ll analyze your performance to give you personalized recommendations.'}
      </p>
      <div className="bg-racing-gray-50 dark:bg-racing-gray-900/50 rounded-lg p-4 max-w-sm mx-auto">
        <p className="text-sm text-racing-gray-600 dark:text-racing-gray-400">
          <strong className="text-racing-gray-700 dark:text-racing-gray-300">Tip:</strong> We recommend at least 5-10 races
          to generate accurate recommendations based on your driving style.
        </p>
      </div>
    </div>
  );
}

/**
 * Detail modal for viewing full recommendation details
 */
function DetailModal({
  recommendation,
  mode,
  onClose,
}: {
  recommendation: ScoredRecommendation;
  mode: RecommendationMode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-racing-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-racing-gray-800 border-b border-racing-gray-200 dark:border-racing-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-racing-gray-900 dark:text-white">
              {recommendation.seriesName}
            </h2>
            <p className="text-sm text-racing-gray-600 dark:text-racing-gray-400">
              @ {recommendation.trackName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-racing-gray-400 hover:text-racing-gray-600 dark:hover:text-racing-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <RecommendationDetails recommendation={recommendation} mode={mode} />
        </div>
      </div>
    </div>
  );
}
