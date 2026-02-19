import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

interface StaleDataNoticeProps {
  lastRaceDate?: string;
  daysSinceLastRace?: number;
  onRefresh?: () => void;
}

export function StaleDataNotice({ lastRaceDate, daysSinceLastRace = 14, onRefresh }: StaleDataNoticeProps) {
  // Only show if it's been a while since last race
  if (daysSinceLastRace < 14) return null;

  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
      <div className="flex items-start gap-3 flex-1">
        <Clock className="w-4 h-4 text-[var(--accent-caution)] mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
            Recommendations based on older data
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {lastRaceDate 
              ? `Your most recent race was ${lastRaceDate}. Race again to update recommendations with current form.`
              : `It's been ${daysSinceLastRace} days since your last race. Race again to update recommendations with current form.`
            }
          </p>
        </div>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-emphasis)] hover:text-[var(--text-primary)] transition-all flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Check for Updates</span>
        </button>
      )}
    </div>
  );
}
