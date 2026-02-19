import React from 'react';
import { Info } from 'lucide-react';

interface FirstTimeUserMessageProps {
  onDismiss: () => void;
}

export function FirstTimeUserMessage({ onDismiss }: FirstTimeUserMessageProps) {
  return (
    <div className="bg-[var(--accent-info-bg)] border border-[var(--accent-info)] border-opacity-30 rounded-lg px-5 py-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-[var(--accent-info)] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            These recommendations are based on your racing history and this week's schedule. We analyze your performance patterns to suggest races where you're likely to perform well.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-[var(--accent-info)] hover:text-[var(--text-primary)] transition-colors font-medium flex-shrink-0"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
