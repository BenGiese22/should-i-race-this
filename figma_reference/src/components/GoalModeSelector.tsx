import React from 'react';
import { Target, TrendingUp, Shield, Lock } from 'lucide-react';

export type GoalMode = 'balanced' | 'irating' | 'safety';

interface GoalModeSelectorProps {
  selectedMode: GoalMode;
  onModeChange: (mode: GoalMode) => void;
  isProUser?: boolean;
}

const modes = [
  {
    id: 'balanced' as GoalMode,
    label: 'Balanced',
    icon: Target,
    description: 'Balance iRating gains with safety risk management',
    shortDesc: 'Recommendations weigh both performance and safety factors',
    proOnly: false,
    purpose: 'Find races where you tend to gain positions while keeping incidents low',
    whatChanges: 'Weights all factors without extreme bias'
  },
  {
    id: 'irating' as GoalMode,
    label: 'iRating Push',
    icon: TrendingUp,
    description: 'Prioritize maximum iRating gains and competitive fields',
    shortDesc: 'Recommendations emphasize rating gains, accept higher incident risk',
    proOnly: true,
    purpose: 'Favor races with strong field strength and high rating upside',
    whatChanges: 'Increases performance factor weights significantly'
  },
  {
    id: 'safety' as GoalMode,
    label: 'Safety Recovery',
    icon: Shield,
    description: 'Focus on clean racing and Safety Rating improvement',
    shortDesc: 'Recommendations prioritize clean races, minimize incident exposure',
    proOnly: true,
    purpose: 'Find races where you historically avoid incidents and finish clean',
    whatChanges: 'Reduces incident risk weight, deprioritizes position gains'
  }
];

export function GoalModeSelector({ selectedMode, onModeChange, isProUser = false }: GoalModeSelectorProps) {
  const activeMode = modes.find(m => m.id === selectedMode);
  
  return (
    <div>
      <div className="flex gap-3 mb-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          const isLocked = mode.proOnly && !isProUser;
          
          return (
            <button
              key={mode.id}
              onClick={() => {
                if (isLocked) {
                  // Could trigger upgrade modal here
                  console.log('Pro upgrade needed for', mode.label);
                } else {
                  onModeChange(mode.id);
                }
              }}
              className={`
                flex-1 flex flex-col gap-3 p-4 rounded-lg border-2 transition-all relative
                ${isSelected 
                  ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] shadow-lg shadow-[var(--accent-primary-glow)]' 
                  : isLocked
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-75 cursor-pointer hover:opacity-90'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-hover)] cursor-pointer'
                }
              `}
            >
              {/* Header Row */}
              <div className="flex items-center gap-3">
                <div className={`
                  p-2.5 rounded-lg flex-shrink-0
                  ${isSelected 
                    ? 'bg-[var(--accent-primary)] text-[#1A1D23]' 
                    : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
                  }
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className={`font-semibold flex items-center gap-2 ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {mode.label}
                    {isLocked && (
                      <Lock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    )}
                  </div>
                  {isLocked && (
                    <div className="text-xs text-[var(--accent-primary)] mt-0.5 font-medium">
                      Pro
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mode Information - Show for all modes */}
              <div className="space-y-2 text-left">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {mode.purpose}
                </p>
                <div className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-[var(--accent-info)] mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                    {mode.whatChanges}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Active mode explanation */}
      {activeMode && (
        <p className="text-sm text-[var(--text-secondary)] pl-1">
          {activeMode.shortDesc}
        </p>
      )}
    </div>
  );
}