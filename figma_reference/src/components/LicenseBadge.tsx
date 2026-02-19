import React from 'react';

export type LicenseClass = 'Rookie' | 'D' | 'C' | 'B' | 'A' | 'Pro';

interface LicenseBadgeProps {
  license: LicenseClass;
  className?: string;
  variant?: 'default' | 'compact';
}

const licenseConfig = {
  Rookie: { 
    label: 'Rookie', 
    color: 'var(--license-rookie)',
    glow: 'var(--license-rookie-glow)'
  },
  D: { 
    label: 'Class D', 
    color: 'var(--license-d)',
    glow: 'var(--license-d-glow)'
  },
  C: { 
    label: 'Class C', 
    color: 'var(--license-c)',
    glow: 'var(--license-c-glow)'
  },
  B: { 
    label: 'Class B', 
    color: 'var(--license-b)',
    glow: 'var(--license-b-glow)'
  },
  A: { 
    label: 'Class A', 
    color: 'var(--license-a)',
    glow: 'var(--license-a-glow)'
  },
  Pro: { 
    label: 'Pro', 
    color: 'var(--license-pro)',
    glow: 'var(--license-pro-glow)'
  },
};

export function LicenseBadge({ license, className = '', variant = 'default' }: LicenseBadgeProps) {
  const config = licenseConfig[license];
  
  return (
    <div 
      className={`
        inline-flex items-center justify-center rounded-md font-semibold
        ${variant === 'compact' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
        ${className}
      `}
      style={{ 
        backgroundColor: config.color,
        color: license === 'C' ? '#1A1D23' : '#FFFFFF',
        boxShadow: `0 0 0 1px ${config.glow}`
      }}
    >
      {config.label}
    </div>
  );
}
