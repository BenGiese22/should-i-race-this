import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { GoalMode } from './GoalModeSelector';

interface ModeChangeNotificationProps {
  mode: GoalMode;
  show: boolean;
  onDismiss: () => void;
}

const modeMessages: Record<GoalMode, { title: string; description: string }> = {
  balanced: {
    title: 'Balanced Mode',
    description: 'Recommendations now balance performance and safety factors based on your history.'
  },
  irating: {
    title: 'iRating Push Mode',
    description: 'Recommendations now emphasize rating gains and competitive field strength.'
  },
  safety: {
    title: 'Safety Recovery Mode',
    description: 'Recommendations now prioritize races where you typically avoid incidents.'
  }
};

export function ModeChangeNotification({ mode, show, onDismiss }: ModeChangeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const message = modeMessages[mode];

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for fade out animation
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div 
      className={`
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <div className="flex items-start gap-3 px-5 py-4 bg-[var(--bg-elevated)] border border-[var(--accent-primary)] rounded-lg shadow-lg">
        <div className="flex-shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {message.title}
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {message.description}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="flex-shrink-0 p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>
      </div>
    </div>
  );
}