'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RecommendationMode } from '@/lib/recommendations/types';
import { Scale, TrendingUp, Shield } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: RecommendationMode;
  onModeChange: (mode: RecommendationMode) => void;
  disabled?: boolean;
}

const modeConfig = {
  balanced: {
    label: 'Balanced',
    description: 'Optimal balance of performance and safety',
    icon: Scale
  },
  irating_push: {
    label: 'iRating Push',
    description: 'Focus on maximizing iRating gains',
    icon: TrendingUp
  },
  safety_recovery: {
    label: 'Safety Recovery',
    description: 'Prioritize Safety Rating improvement',
    icon: Shield
  }
};

export function ModeSelector({ currentMode, onModeChange, disabled = false }: ModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendation Mode</h3>
        <p className="text-sm text-gray-600">
          Choose your racing focus to get personalized recommendations
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(modeConfig) as RecommendationMode[]).map((mode) => {
          const config = modeConfig[mode];
          const isActive = currentMode === mode;
          
          return (
            <Button
              key={mode}
              variant={isActive ? "default" : "outline"}
              className={`h-auto p-4 flex flex-col items-start text-left transition-all duration-200 ${
                isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
              onClick={() => onModeChange(mode)}
              disabled={disabled}
            >
              <div className="flex items-center gap-2 mb-2 w-full">
                <config.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{config.label}</span>
              </div>
              <span className="text-xs text-gray-600 leading-relaxed text-left">
                {config.description}
              </span>
            </Button>
          );
        })}
      </div>
      
      {currentMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-900">
              Current Mode: {modeConfig[currentMode].label}
            </span>
            {React.createElement(modeConfig[currentMode].icon, { className: "w-4 h-4 text-blue-700" })}
          </div>
          <p className="text-sm text-blue-700">
            {modeConfig[currentMode].description}
          </p>
        </div>
      )}
    </div>
  );
}