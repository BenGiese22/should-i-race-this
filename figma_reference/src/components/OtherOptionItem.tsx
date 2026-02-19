import React from 'react';
import { LicenseBadge, LicenseClass } from './LicenseBadge';

export interface OtherOption {
  id: string;
  seriesName: string;
  track: string;
  license: LicenseClass;
  score: number;
}

interface OtherOptionItemProps {
  option: OtherOption;
  onClick?: () => void;
}

export function OtherOptionItem({ option, onClick }: OtherOptionItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--border-medium)] hover:bg-[var(--bg-hover)] transition-all text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--text-primary)] mb-0.5 truncate">
          {option.seriesName}
        </div>
        <div className="text-sm text-[var(--text-secondary)] truncate">
          {option.track}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <LicenseBadge license={option.license} variant="compact" />
        
        <div className="text-right">
          <div className="text-xs text-[var(--text-tertiary)] mb-0.5">Score</div>
          <div className="text-sm font-semibold stat-number text-[var(--text-secondary)]">
            {option.score}
          </div>
        </div>
      </div>
    </button>
  );
}