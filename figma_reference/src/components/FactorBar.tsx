import React from 'react';

interface FactorBarProps {
  label: string;
  value: number; // 0-100
  color?: 'positive' | 'caution' | 'neutral';
  className?: string;
}

export function FactorBar({ label, value, color = 'neutral', className = '' }: FactorBarProps) {
  const barColors = {
    positive: 'var(--semantic-positive)',
    caution: 'var(--semantic-caution)',
    neutral: 'var(--accent-info)'
  };
  
  const bgColors = {
    positive: 'var(--semantic-positive-bg)',
    caution: 'var(--semantic-caution-bg)',
    neutral: 'var(--accent-info-bg)'
  };
  
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <span className="text-sm font-semibold stat-number" style={{ color: barColors[color] }}>
          {value}%
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: bgColors[color] }}>
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${value}%`,
            backgroundColor: barColors[color]
          }}
        />
      </div>
    </div>
  );
}
