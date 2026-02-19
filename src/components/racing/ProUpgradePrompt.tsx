'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface ProUpgradePromptProps {
  feature: string;
  description: string;
  inline?: boolean;
  onUpgrade?: () => void;
}

export function ProUpgradePrompt({ feature, description, inline = false, onUpgrade }: ProUpgradePromptProps) {
  if (inline) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg">
        <Zap className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-[var(--text-secondary)]">
            <span className="text-[var(--accent-primary)]">Pro</span> • {description}
          </div>
        </div>
        <button 
          onClick={onUpgrade}
          className="text-xs font-semibold text-[var(--accent-primary)] hover:text-[var(--accent-primary-bright)] transition-colors whitespace-nowrap"
        >
          Unlock
        </button>
      </div>
    );
  }
  
  return (
    <div className="px-6 py-5 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-[var(--accent-primary-glow)] rounded-lg">
          <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {feature}
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {description}
          </p>
        </div>
        <button 
          onClick={onUpgrade}
          className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-bright)] text-[#1A1D23] text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          Unlock Pro
        </button>
      </div>
    </div>
  );
}
