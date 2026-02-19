'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface LimitedHistoryBadgeProps {
  raceCount: number;
  threshold?: number;
}

export function LimitedHistoryBadge({ raceCount, threshold = 5 }: LimitedHistoryBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (raceCount >= threshold) return null;

  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent-info-bg)] border border-[var(--accent-info)] border-opacity-30 rounded-md text-xs font-medium text-[var(--accent-info)] hover:bg-[var(--accent-info)] hover:bg-opacity-10 transition-colors"
      >
        <Info className="w-3 h-3" />
        <span>Limited History</span>
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-10">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg p-3 shadow-xl">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Based on {raceCount} race{raceCount === 1 ? '' : 's'} you've completed. Confidence will improve as you race this series more.
            </p>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-[var(--bg-elevated)] border-r border-b border-[var(--border-medium)] rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
