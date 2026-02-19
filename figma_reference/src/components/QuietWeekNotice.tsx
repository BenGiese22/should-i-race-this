import React from 'react';
import { Calendar } from 'lucide-react';

interface QuietWeekNoticeProps {
  totalRecommendations: number;
}

export function QuietWeekNotice({ totalRecommendations }: QuietWeekNoticeProps) {
  if (totalRecommendations > 2) return null;

  return (
    <div className="flex items-start gap-3 px-5 py-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
      <Calendar className="w-4 h-4 text-[var(--accent-info)] mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {totalRecommendations === 1 
            ? 'A quieter week — here\'s your best option based on current track rotations.'
            : 'A quieter week — here are your best options based on current track rotations.'}
        </p>
      </div>
    </div>
  );
}
