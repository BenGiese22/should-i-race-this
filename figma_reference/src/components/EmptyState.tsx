import React from 'react';
import { Calendar, Search, Target } from 'lucide-react';

type EmptyStateType = 'no-recommendations' | 'no-matching-mode' | 'no-series-this-week';

interface EmptyStateProps {
  type: EmptyStateType;
  currentMode?: string;
  onSuggestedAction?: () => void;
}

const emptyStateContent = {
  'no-recommendations': {
    icon: Calendar,
    title: 'No eligible races this week',
    description: 'Based on your current settings and owned content, there are no matches for this week\'s schedule.',
    suggestions: [
      'Check back next week for new track rotations',
      'Browse other goal modes to see different priorities',
      'Review races you haven\'t tried recently'
    ],
    actionLabel: null
  },
  'no-matching-mode': {
    icon: Target,
    title: 'No matches for this goal mode',
    description: 'Your racing history doesn\'t include races that fit this specific focus right now.',
    suggestions: [
      'Try Balanced mode for a broader view',
      'Race a few sessions to build history in different series',
      'Check other recommendations below'
    ],
    actionLabel: 'Switch to Balanced'
  },
  'no-series-this-week': {
    icon: Search,
    title: 'A quieter week',
    description: 'Your primary series aren\'t running this week, or track rotations don\'t match your owned content.',
    suggestions: [
      'This is normal — schedules rotate weekly',
      'Consider exploring a new series',
      'Use this time for practice or other racing'
    ],
    actionLabel: null
  }
};

export function EmptyState({ type, currentMode, onSuggestedAction }: EmptyStateProps) {
  const content = emptyStateContent[type];
  const Icon = content.icon;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-12">
      <div className="max-w-md mx-auto text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-[var(--bg-elevated)] rounded-xl">
            <Icon className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {content.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* Suggestions */}
        <div className="pt-4 space-y-2">
          {content.suggestions.map((suggestion, idx) => (
            <div key={idx} className="flex items-start gap-3 text-left">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-info)] mt-2 flex-shrink-0" />
              <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
                {suggestion}
              </p>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {content.actionLabel && onSuggestedAction && (
          <div className="pt-4">
            <button
              onClick={onSuggestedAction}
              className="px-5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-emphasis)] hover:text-[var(--text-primary)] transition-all"
            >
              {content.actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
