'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRecommendations } from '@/lib/hooks';
import type { ScoredRecommendation, RecommendationMode, Category, SeriesTrackHistory } from '@/lib/recommendations/types';
import {
  PrimaryRecommendationCard,
  SecondaryRecommendationCard,
  OtherOptionItem,
  GoalModeSelector,
  EmptyState,
  FirstTimeLoadingState,
  ReturningUserLoadingState,
  type GoalMode,
  type OtherOption,
  type PrimaryRecommendation,
  type SecondaryRecommendation,
} from '@/components/racing';

interface SyncStatus {
  lastSyncAt: string | null;
  totalRaces: number;
}

/**
 * Get user's timezone
 */
function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Format time in user's timezone
 */
function formatTimeInUserTimezone(hour: number): string {
  const now = new Date();
  const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, 0, 0));
  
  return utcDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get timezone abbreviation
 */
function getTimezoneAbbreviation(): string {
  try {
    const timezone = getUserTimezone();
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch {
    return 'UTC';
  }
}

/**
 * Find user's history for a specific series/track combination
 */
function findUserHistory(
  seriesId: number,
  trackId: number,
  userHistory?: SeriesTrackHistory[]
): SeriesTrackHistory | null {
  if (!userHistory) return null;
  return userHistory.find(h => h.seriesId === seriesId && h.trackId === trackId) || null;
}

/**
 * Aggregate user's history for an entire series (all tracks)
 */
function aggregateSeriesHistory(
  seriesId: number,
  userHistory?: SeriesTrackHistory[]
): { raceCount: number; avgPositionDelta: number; avgIncidents: number } | null {
  if (!userHistory) return null;
  
  const seriesRecords = userHistory.filter(h => h.seriesId === seriesId);
  if (seriesRecords.length === 0) return null;
  
  const totalRaces = seriesRecords.reduce((sum, h) => sum + h.raceCount, 0);
  
  // Weighted average by race count
  const weightedPositionDelta = seriesRecords.reduce(
    (sum, h) => sum + (h.avgPositionDelta * h.raceCount), 
    0
  ) / totalRaces;
  
  const weightedIncidents = seriesRecords.reduce(
    (sum, h) => sum + (h.avgIncidents * h.raceCount), 
    0
  ) / totalRaces;
  
  return {
    raceCount: totalRaces,
    avgPositionDelta: weightedPositionDelta,
    avgIncidents: weightedIncidents
  };
}

/**
 * Format race frequency from repeat minutes
 */
function formatRaceFrequency(repeatMinutes: number | null | undefined): string {
  if (!repeatMinutes) return 'Limited schedule';
  
  if (repeatMinutes < 60) {
    return `Every ${repeatMinutes} min`;
  }
  
  const hours = repeatMinutes / 60;
  if (hours === 1) return 'Every hour';
  if (hours === 2) return 'Every 2 hours';
  if (hours === 4) return 'Every 4 hours';
  if (hours % 1 === 0) return `Every ${hours} hours`;
  
  return `Every ${repeatMinutes} min`;
}

/**
 * Transform ScoredRecommendation to PrimaryRecommendation format
 */
function transformToPrimaryRecommendation(
  rec: ScoredRecommendation,
  userHistory?: SeriesTrackHistory[]
): PrimaryRecommendation {
  // Get next available time slot (simplified - just use first slot)
  const nextSlot = rec.timeSlots?.[0];
  const now = new Date();
  const userTz = getTimezoneAbbreviation();
  
  // Find user's history for this series/track
  const history = findUserHistory(rec.seriesId, rec.trackId, userHistory);
  
  // If no exact match, aggregate series-level history
  const seriesHistory = history || aggregateSeriesHistory(rec.seriesId, userHistory);
  
  return {
    id: `${rec.seriesId}-${rec.trackId}`,
    seriesName: rec.seriesName,
    track: rec.trackName,
    license: rec.licenseRequired as any,
    
    // Schedule - use user's timezone
    nextRaceTime: nextSlot ? formatTimeInUserTimezone(nextSlot.hour) : 'TBD',
    nextRaceDate: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sessionLength: `${rec.raceLength} min`,
    raceType: rec.hasOpenSetup ? 'Open' : 'Fixed',
    frequency: formatRaceFrequency(rec.repeatMinutes),
    timezone: userTz,
    
    // Personal Context - use series history if exact match not found
    userRaceCount: seriesHistory?.raceCount || 0,
    avgPositionDelta: seriesHistory?.avgPositionDelta || 0,
    avgIncidents: seriesHistory?.avgIncidents || 0,
    
    // Factors
    factors: [
      {
        label: 'Performance Match',
        value: Math.round(rec.score.factors.performance),
        color: rec.score.factors.performance > 70 ? 'positive' : rec.score.factors.performance > 40 ? 'neutral' : 'caution',
        description: 'How well this race matches your skill level'
      },
      {
        label: 'Safety',
        value: Math.round(rec.score.factors.safety),
        color: rec.score.factors.safety > 70 ? 'positive' : rec.score.factors.safety > 40 ? 'neutral' : 'caution',
        description: 'Expected incident rate based on your history'
      },
      {
        label: 'Familiarity',
        value: Math.round(rec.score.factors.familiarity),
        color: rec.score.factors.familiarity > 70 ? 'positive' : rec.score.factors.familiarity > 40 ? 'neutral' : 'caution',
        description: 'Your experience with this series and track'
      }
    ],
    
    // Confidence
    confidence: Math.round(rec.score.overall),
    
    // Expanded Details
    modeExplanation: rec.score.reasoning?.[0] || 'This recommendation is based on your racing history and performance.',
    scoringBreakdown: [
      { factor: 'Performance', score: Math.round(rec.score.factors.performance), weight: 1.0, contribution: Math.round(rec.score.factors.performance) },
      { factor: 'Safety', score: Math.round(rec.score.factors.safety), weight: 1.0, contribution: Math.round(rec.score.factors.safety) },
      { factor: 'Consistency', score: Math.round(rec.score.factors.consistency), weight: 1.0, contribution: Math.round(rec.score.factors.consistency) },
    ],
    insights: rec.score.reasoning || []
  };
}

/**
 * Transform ScoredRecommendation to SecondaryRecommendation format
 */
function transformToSecondaryRecommendation(rec: ScoredRecommendation): SecondaryRecommendation {
  const nextSlot = rec.timeSlots?.[0];
  const userTz = getTimezoneAbbreviation();
  
  return {
    id: `${rec.seriesId}-${rec.trackId}`,
    seriesName: rec.seriesName,
    track: rec.trackName,
    license: rec.licenseRequired as any,
    
    // Schedule - use user's timezone
    nextRaceTime: nextSlot ? formatTimeInUserTimezone(nextSlot.hour) : 'TBD',
    sessionLength: `${rec.raceLength} min`,
    raceType: rec.hasOpenSetup ? 'Open' : 'Fixed',
    frequency: formatRaceFrequency(rec.repeatMinutes),
    timezone: userTz,
    
    // Confidence & Risk
    confidence: Math.round(rec.score.overall),
    risk: rec.score.safetyRatingRisk === 'low' ? 'low' : rec.score.safetyRatingRisk === 'moderate' ? 'moderate' : 'elevated',
    
    // Top Factors
    topFactors: [
      {
        label: 'Performance',
        value: Math.round(rec.score.factors.performance),
        color: rec.score.factors.performance > 70 ? 'positive' : rec.score.factors.performance > 40 ? 'neutral' : 'caution'
      },
      {
        label: 'Safety',
        value: Math.round(rec.score.factors.safety),
        color: rec.score.factors.safety > 70 ? 'positive' : rec.score.factors.safety > 40 ? 'neutral' : 'caution'
      }
    ],
    
    whyGoodOption: rec.score.reasoning?.slice(0, 3)
  };
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
 * Map GoalMode to RecommendationMode
 */
function mapGoalModeToRecommendationMode(goalMode: GoalMode): RecommendationMode {
  const modeMap: Record<GoalMode, RecommendationMode> = {
    balanced: 'balanced',
    push: 'push',
    recovery: 'recovery',
  };
  return modeMap[goalMode];
}

/**
 * RecommendationsClient - Client Component for interactivity
 * 
 * Handles:
 * - Mode selection (balanced/push/recovery)
 * - Category filtering
 * - Data fetching and state management
 * - Loading and error states
 * 
 * Requirements: 6.1, 6.3
 */
export function RecommendationsClient() {
  const [goalMode, setGoalMode] = useState<GoalMode>('balanced');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isProUser, setIsProUser] = useState(false);

  // Map goal mode to recommendation mode
  const mode = mapGoalModeToRecommendationMode(goalMode);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Listen for pro mode changes from header
  useEffect(() => {
    const handleProModeChange = (e: CustomEvent<boolean>) => {
      setIsProUser(e.detail);
    };
    
    // Check initial value
    const stored = localStorage.getItem('dev_pro_mode');
    if (stored) {
      setIsProUser(stored === 'true');
    }
    
    window.addEventListener('pro-mode-change', handleProModeChange as EventListener);
    return () => window.removeEventListener('pro-mode-change', handleProModeChange as EventListener);
  }, []);

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

  // Get recommendations for current category
  // Show top 8 total: #1 (primary), #2-3 (secondary), #4-8 (other options)
  const recommendations = data?.recommendations || [];
  const primaryRecommendation = recommendations[0];
  const secondaryRecommendations = recommendations.slice(1, 3);
  const otherRecommendations = recommendations.slice(3, 8);

  // Convert other recommendations to OtherOption format
  const otherOptions: OtherOption[] = otherRecommendations.map((rec) => ({
    id: `${rec.seriesId}-${rec.trackId}`,
    seriesName: rec.seriesName,
    track: rec.trackName,
    license: rec.licenseRequired as any, // Use licenseRequired from ScoredRecommendation
    score: Math.round(rec.score.overall),
  }));

  // Loading state
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        {data?.userProfile ? (
          <ReturningUserLoadingState />
        ) : (
          <FirstTimeLoadingState />
        )}
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
    const hasAnyData = data?.userProfile?.experienceSummary?.totalRaces > 0;
    const emptyStateType = hasAnyData ? 'no-matching-mode' : 'no-recommendations';
    
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Mode selector */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <GoalModeSelector
            currentMode={goalMode}
            onModeChange={setGoalMode}
            disabled={loading}
          />
        </div>

        <EmptyState
          type={emptyStateType}
          currentMode={goalMode}
          onSuggestedAction={emptyStateType === 'no-matching-mode' ? () => setGoalMode('balanced') : undefined}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header with sync */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            What Should I Race?
          </h1>
          <p className="text-text-secondary mt-1">
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
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-elevated text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Fetch latest race data from iRacing
              <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-elevated" />
            </div>
          </div>
          {/* Last synced timestamp */}
          {syncStatus?.lastSyncAt && (
            <p className="text-xs text-text-tertiary">
              Last synced: {formatRelativeTime(syncStatus.lastSyncAt)}
            </p>
          )}
          {syncError && (
            <p className="text-xs text-semantic-danger">{syncError}</p>
          )}
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <GoalModeSelector
          currentMode={goalMode}
          onModeChange={setGoalMode}
          disabled={loading}
        />
      </div>

      {/* Experience summary (subtle context) */}
      {data?.userProfile?.experienceSummary && (
        <div className="flex items-center gap-4 text-sm text-text-tertiary">
          <span>Based on {data.userProfile.experienceSummary.totalRaces} races</span>
          <span className="text-border-medium">•</span>
          <span>{data.userProfile.experienceSummary.seriesWithExperience} series</span>
          <span className="text-border-medium">•</span>
          <span>{data.userProfile.experienceSummary.tracksWithExperience} tracks</span>
        </div>
      )}

      {/* Primary recommendation (#1) */}
      {primaryRecommendation && (
        <section>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
            Top Pick for You
          </h2>
          <PrimaryRecommendationCard
            recommendation={transformToPrimaryRecommendation(
              primaryRecommendation,
              data?.userHistory?.seriesTrackHistory
            )}
            isProUser={isProUser}
          />
        </section>
      )}

      {/* Secondary recommendations (#2, #3) */}
      {secondaryRecommendations.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
            Also Great Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secondaryRecommendations.map((rec, index) => (
              <SecondaryRecommendationCard
                key={`${rec.seriesId}-${rec.trackId}`}
                recommendation={transformToSecondaryRecommendation(rec)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Other options */}
      {otherOptions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-4">
            More Options
          </h2>
          <div className="space-y-2">
            {otherOptions.map((option) => (
              <OtherOptionItem
                key={option.id}
                option={option}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Error state component
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
    <div className="bg-surface border border-border-subtle rounded-xl p-8 text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-semantic-danger-bg flex items-center justify-center">
        <svg className="w-6 h-6 text-semantic-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">
        Something went wrong
      </h2>
      <p className="text-text-secondary mb-4">
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
