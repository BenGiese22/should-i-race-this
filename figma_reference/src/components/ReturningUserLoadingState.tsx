import React from 'react';
import { RefreshCw } from 'lucide-react';
import { 
  PrimaryRecommendationSkeleton, 
  SecondaryRecommendationSkeleton, 
  OtherOptionSkeleton 
} from './SkeletonCard';

interface ReturningUserLoadingStateProps {
  lastSyncTime?: string;
}

export function ReturningUserLoadingState({ lastSyncTime }: ReturningUserLoadingStateProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div>
            <h1 className="mb-2">What Should I Race?</h1>
            <p className="text-[var(--text-secondary)]">
              Personalized recommendations based on your history, goals, and this week's schedule
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Inline Refresh Indicator */}
        <section>
          <div className="flex items-center gap-3 px-5 py-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
            <RefreshCw className="w-4 h-4 text-[var(--accent-info)] animate-spin" />
            <span className="text-sm text-[var(--text-secondary)]">
              Refreshing recommendations…
            </span>
            {lastSyncTime && (
              <>
                <div className="h-4 w-px bg-[var(--border-medium)]" />
                <span className="text-sm text-[var(--text-tertiary)]">
                  Last synced {lastSyncTime}
                </span>
              </>
            )}
          </div>
        </section>

        {/* Skeleton Content */}
        <section>
          <div className="h-6 w-24 bg-[var(--bg-elevated)] rounded mb-4 animate-pulse" />
          <div className="space-y-2 mb-4">
            <div className="h-6 w-48 bg-[var(--bg-elevated)] rounded animate-pulse" />
          </div>
          <PrimaryRecommendationSkeleton />
        </section>

        <section>
          <div className="h-6 w-40 bg-[var(--bg-elevated)] rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecondaryRecommendationSkeleton />
            <SecondaryRecommendationSkeleton />
          </div>
        </section>

        <section>
          <div className="h-6 w-32 bg-[var(--bg-elevated)} rounded mb-4 animate-pulse" />
          <div className="space-y-2">
            <OtherOptionSkeleton />
            <OtherOptionSkeleton />
            <OtherOptionSkeleton />
          </div>
        </section>

      </main>

      <div className="h-16" />
    </div>
  );
}
