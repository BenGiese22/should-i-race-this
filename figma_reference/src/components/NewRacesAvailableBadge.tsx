import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface NewRacesAvailableBadgeProps {
  count: number;
  onDismiss?: () => void;
}

export function NewRacesAvailableBadge({ count, onDismiss }: NewRacesAvailableBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (count === 0) return null;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[var(--accent-primary-glow)] rounded-md">
            <Plus className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {count} new {count === 1 ? 'race' : 'races'} available
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Schedule updated with additional options
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-5 py-4 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
            New races have been added to your eligible options based on updated track rotations or content ownership.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsExpanded(false);
                // Smooth scroll to recommendations would happen here
              }}
              className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-emphasis)] hover:text-[var(--text-primary)] transition-all"
            >
              Review New Options
            </button>
            {onDismiss && (
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onDismiss();
                }}
                className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
