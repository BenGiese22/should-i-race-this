import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ConfidenceChangeIndicatorProps {
  previousValue: number;
  currentValue: number;
  reason?: string;
  autoFade?: boolean;
}

export function ConfidenceChangeIndicator({ 
  previousValue, 
  currentValue,
  reason,
  autoFade = true 
}: ConfidenceChangeIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const delta = currentValue - previousValue;
  const isIncrease = delta > 0;
  
  // Only show if change is meaningful (>= 5 points)
  if (Math.abs(delta) < 5) return null;

  useEffect(() => {
    if (autoFade) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [autoFade]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-2.5 py-1.5
        rounded-md
        transition-all duration-300
        ${isIncrease 
          ? 'bg-[var(--semantic-positive)] bg-opacity-10 border border-[var(--semantic-positive)] border-opacity-20' 
          : 'bg-[var(--accent-caution-bg)] border border-[var(--accent-caution)] border-opacity-20'
        }
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {isIncrease ? (
        <TrendingUp className="w-3.5 h-3.5 text-[var(--semantic-positive)]" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5 text-[var(--accent-caution)]" />
      )}
      <div className="flex flex-col">
        <span className={`text-xs font-semibold ${isIncrease ? 'text-[var(--semantic-positive)]' : 'text-[var(--accent-caution)]'}`}>
          {isIncrease ? '+' : ''}{delta} points
        </span>
        {reason && (
          <span className="text-xs text-[var(--text-tertiary)] leading-tight mt-0.5">
            {reason}
          </span>
        )}
      </div>
    </div>
  );
}
