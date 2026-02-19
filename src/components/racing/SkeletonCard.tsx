import React from 'react';

export function PrimaryRecommendationSkeleton() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-8 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded mb-3" />
          <div className="h-6 w-64 bg-[var(--bg-elevated)] rounded mb-2" />
          <div className="h-5 w-56 bg-[var(--bg-elevated)] rounded" />
        </div>
        <div className="h-10 w-24 bg-[var(--bg-elevated)] rounded-lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-3 w-20 bg-[var(--bg-elevated)] rounded mb-2" />
            <div className="h-5 w-16 bg-[var(--bg-elevated)] rounded" />
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="pt-6 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 w-full bg-[var(--bg-elevated)] rounded mb-2" />
            <div className="h-4 w-3/4 bg-[var(--bg-elevated)] rounded" />
          </div>
          <div className="h-10 w-32 bg-[var(--bg-elevated)] rounded-lg ml-6" />
        </div>
      </div>
    </div>
  );
}

export function SecondaryRecommendationSkeleton() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-5 w-48 bg-[var(--bg-elevated)] rounded mb-2" />
          <div className="h-4 w-40 bg-[var(--bg-elevated)] rounded" />
        </div>
        <div className="h-8 w-20 bg-[var(--bg-elevated)] rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="h-3 w-16 bg-[var(--bg-elevated)] rounded mb-2" />
            <div className="h-4 w-12 bg-[var(--bg-elevated)] rounded" />
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="pt-4 border-t border-[var(--border-subtle)]">
        <div className="h-3 w-full bg-[var(--bg-elevated)] rounded mb-2" />
        <div className="h-3 w-4/5 bg-[var(--bg-elevated)] rounded" />
      </div>
    </div>
  );
}

export function OtherOptionSkeleton() {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-5 py-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-8 w-20 bg-[var(--bg-elevated)] rounded-lg" />
        <div className="flex-1">
          <div className="h-4 w-48 bg-[var(--bg-elevated)] rounded mb-2" />
          <div className="h-3 w-40 bg-[var(--bg-elevated)] rounded" />
        </div>
        <div className="h-6 w-12 bg-[var(--bg-elevated)] rounded" />
      </div>
    </div>
  );
}
