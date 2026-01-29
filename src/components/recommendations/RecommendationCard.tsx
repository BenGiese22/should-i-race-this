'use client';

import { useState } from 'react';
import { LicenseBadge } from '@/components/ui/LicenseBadge';
import { ScoreProgressBar } from '@/components/ui/ScoreProgressBar';
import { ConfidenceBadge } from './ConfidenceBadge';
import { RecommendationDetails } from './RecommendationDetails';
import type { ScoredRecommendation, RecommendationMode } from '@/lib/recommendations/types';

interface RecommendationCardProps {
  recommendation: ScoredRecommendation;
  rank: number;
  mode: RecommendationMode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

/**
 * Get timezone abbreviation from a Date
 */
function getTimezoneAbbreviation(): string {
  const date = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Get the timezone abbreviation using formatToParts
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
    timeZone,
  });

  const parts = formatter.formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  return tzPart?.value || '';
}

/**
 * Format race time for display in user's local timezone
 */
function formatNextRaceTime(timeSlots: ScoredRecommendation['timeSlots']): string {
  if (!timeSlots || timeSlots.length === 0) return 'Check schedule';

  const slot = timeSlots[0];
  const utcHour = slot.hour;

  // Create a date in UTC with the race hour
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    utcHour,
    0,
    0
  ));

  // Format in local timezone
  const localHour = utcDate.getHours();
  const ampm = localHour >= 12 ? 'PM' : 'AM';
  const hour12 = localHour % 12 || 12;
  const tzAbbr = getTimezoneAbbreviation();

  return `${hour12}:00 ${ampm} (${tzAbbr})`;
}

/**
 * Format race frequency
 */
function formatRaceFrequency(timeSlots: ScoredRecommendation['timeSlots']): string {
  if (!timeSlots || timeSlots.length === 0) return '';
  if (timeSlots.length >= 12) return 'Every 2 hours';
  if (timeSlots.length >= 6) return 'Every 4 hours';
  if (timeSlots.length >= 3) return 'Several times daily';
  return 'Limited schedule';
}

/**
 * Get the relevant "Why" factors based on mode
 * No emojis - ScoreProgressBar will use colored dots based on value
 */
function getModeRelevantFactors(
  mode: RecommendationMode,
  factors: ScoredRecommendation['score']['factors']
): { label: string; value: number; description: string }[] {
  const allFactors = [
    { label: 'Position Gain', value: factors.performance, description: 'Expected finish improvement' },
    { label: 'Safety', value: factors.safety, description: 'Low incident likelihood' },
    { label: 'Familiarity', value: factors.familiarity, description: 'Your experience here' },
    { label: 'Consistency', value: factors.consistency, description: 'Predictable results' },
  ];

  if (mode === 'safety_recovery') {
    return [allFactors[1], allFactors[3], allFactors[2], allFactors[0]];
  }
  if (mode === 'irating_push') {
    return [allFactors[0], allFactors[2], allFactors[3], allFactors[1]];
  }
  return allFactors.slice(0, 3);
}

/**
 * RecommendationCard - Clean design with stats and expandable details
 */
export function RecommendationCard({
  recommendation,
  rank,
  mode,
  variant = 'primary',
  className = '',
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { score, timeSlots } = recommendation;
  const isPrimary = variant === 'primary';

  const relevantFactors = getModeRelevantFactors(mode, score.factors);

  const confidenceLevel =
    score.dataConfidence.performance === 'high' && score.dataConfidence.safety === 'high'
      ? 'high'
      : score.dataConfidence.performance === 'estimated' || score.dataConfidence.safety === 'estimated'
        ? 'estimated'
        : 'no_data';

  return (
    <div
      className={`
        bg-white dark:bg-racing-gray-800 rounded-xl border border-racing-gray-200 dark:border-racing-gray-700
        shadow-sm hover:shadow-md transition-shadow
        ${isPrimary ? 'p-6' : 'p-4'}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Rank badge */}
        <div
          className={`
            flex-shrink-0 flex items-center justify-center rounded-lg font-bold
            ${isPrimary
              ? 'w-10 h-10 text-lg bg-racing-blue text-white'
              : 'w-8 h-8 text-sm bg-racing-gray-100 dark:bg-racing-gray-700 text-racing-gray-600 dark:text-racing-gray-300'
            }
          `}
        >
          #{rank}
        </div>

        {/* Series and Track info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-racing-gray-900 dark:text-white truncate ${isPrimary ? 'text-lg' : 'text-base'}`}>
            {recommendation.seriesName}
          </h3>
          <p className="text-racing-gray-600 dark:text-racing-gray-400 truncate">
            @ {recommendation.trackName}
          </p>
        </div>

        {/* Confidence badge */}
        <ConfidenceBadge level={confidenceLevel} size={isPrimary ? 'md' : 'sm'} />
      </div>

      {/* Stats row */}
      <div className={`grid gap-4 mt-4 ${isPrimary ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* User history */}
        <div className="bg-racing-gray-50 dark:bg-racing-gray-900/50 rounded-lg p-3">
          <p className="text-xs font-medium text-racing-gray-500 dark:text-racing-gray-400 uppercase tracking-wide mb-2">
            Your History
          </p>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-racing-gray-500 dark:text-racing-gray-400">Races:</span>
              <strong className="text-racing-gray-700 dark:text-racing-gray-300">
                {score.factors.familiarity > 0 ? Math.ceil(score.factors.familiarity / 10) : 0}
              </strong>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-racing-gray-500 dark:text-racing-gray-400">Avg Position:</span>
              <strong className={score.factors.performance >= 50 ? 'text-emerald-600' : 'text-amber-500'}>
                {score.factors.performance >= 50 ? '+' : ''}{((score.factors.performance - 50) / 10).toFixed(1)}
              </strong>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-racing-gray-500 dark:text-racing-gray-400">Avg Incidents:</span>
              <strong className={score.factors.safety >= 60 ? 'text-emerald-600' : 'text-amber-500'}>
                {((100 - score.factors.safety) / 10).toFixed(1)}
              </strong>
            </div>
          </div>
        </div>

        {/* This week info */}
        {isPrimary && (
          <div className="bg-racing-gray-50 dark:bg-racing-gray-900/50 rounded-lg p-3">
            <p className="text-xs font-medium text-racing-gray-500 dark:text-racing-gray-400 uppercase tracking-wide mb-2">
              This Week
            </p>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="text-racing-gray-700 dark:text-racing-gray-300">
                Next: <strong>{formatNextRaceTime(timeSlots)}</strong>
              </span>
              <span className="text-racing-gray-400">|</span>
              <span className="text-racing-gray-600 dark:text-racing-gray-400">{recommendation.raceLength}m</span>
              <span className="text-racing-gray-400">|</span>
              <span className="text-racing-gray-600 dark:text-racing-gray-400">
                {recommendation.hasOpenSetup ? 'Open' : 'Fixed'}
              </span>
              <span className="text-racing-gray-400">|</span>
              <LicenseBadge level={recommendation.licenseRequired} variant="full" size="sm" />
            </div>
            <p className="text-xs text-racing-gray-500 dark:text-racing-gray-400 mt-1">
              {formatRaceFrequency(timeSlots)}
            </p>
          </div>
        )}
      </div>

      {/* Why This Race section */}
      <div className="mt-4">
        <p className="text-xs font-medium text-racing-gray-500 dark:text-racing-gray-400 uppercase tracking-wide mb-3">
          Why This Race
        </p>
        <div className="space-y-2">
          {relevantFactors.slice(0, isPrimary ? 3 : 2).map((factor) => (
            <ScoreProgressBar
              key={factor.label}
              value={factor.value}
              label={factor.label}
              description={isPrimary ? factor.description : undefined}
              size={isPrimary ? 'md' : 'sm'}
              showValue
            />
          ))}
        </div>
      </div>

      {/* Expand/collapse button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-4 py-2 text-sm text-racing-gray-500 dark:text-racing-gray-400 hover:text-racing-gray-700 dark:hover:text-racing-gray-200 flex items-center justify-center gap-1 transition-colors"
      >
        {isExpanded ? 'Less Details' : 'More Details'}
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <RecommendationDetails
          recommendation={recommendation}
          mode={mode}
          className="mt-4 pt-4 border-t border-racing-gray-200 dark:border-racing-gray-700"
        />
      )}
    </div>
  );
}