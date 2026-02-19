'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface UpdatedTagProps {
  message?: string;
  autoFade?: boolean;
  fadeDuration?: number;
}

export function UpdatedTag({ 
  message = 'Your top recommendation has changed based on recent data',
  autoFade = true,
  fadeDuration = 8000 
}: UpdatedTagProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoFade) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, fadeDuration);
      
      return () => clearTimeout(timer);
    }
  }, [autoFade, fadeDuration]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 
        bg-[var(--accent-primary-glow)] 
        border border-[var(--accent-primary)] border-opacity-30
        rounded-lg
        transition-all duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-[var(--accent-primary-bright)]">
          Updated
        </span>
        <span className="text-xs text-[var(--text-tertiary)] leading-tight mt-0.5">
          {message}
        </span>
      </div>
    </div>
  );
}
