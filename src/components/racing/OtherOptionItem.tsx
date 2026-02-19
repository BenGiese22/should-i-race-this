'use client';

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
      className="w-full flex items-center gap-4 px-4 py-3 bg-surface border border-border-subtle rounded-lg hover:border-border-medium hover:bg-hover transition-all text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text-primary mb-0.5 truncate">
          {option.seriesName}
        </div>
        <div className="text-sm text-text-secondary truncate">
          {option.track}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <LicenseBadge license={option.license} variant="compact" />
        
        <div className="text-right">
          <div className="text-xs text-text-tertiary mb-0.5">Score</div>
          <div className="text-sm font-semibold stat-number text-text-secondary">
            {option.score}
          </div>
        </div>
      </div>
    </button>
  );
}
