'use client';

import React from 'react';
import { Clock, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LicenseBadge, LicenseClass } from './LicenseBadge';

export interface RaceRecommendation {
  id: string;
  seriesName: string;
  car: string;
  track: string;
  license: LicenseClass;
  nextRace: string; // e.g., "Today 4:00 PM"
  hoursUntil: number;
  avgFieldSize: number;
  
  // Decision factors
  recommendation: 'strong' | 'moderate' | 'caution';
  confidence: number; // 0-100
  
  // Personalized insights
  recentPerformance: 'positive' | 'neutral' | 'negative';
  avgFinish: number;
  racesLast30Days: number;
  
  // Quick stats
  expectedIRatingChange: number;
  srRisk: 'low' | 'medium' | 'high';
}

interface RaceRecommendationCardProps {
  race: RaceRecommendation;
  onClick?: () => void;
}

export function RaceRecommendationCard({ race, onClick }: RaceRecommendationCardProps) {
  const recommendationStyles = {
    strong: {
      border: 'border-[var(--accent-success)]',
      bg: 'bg-emerald-50',
      badge: 'bg-[var(--accent-success)] text-white',
      label: 'Strong Match'
    },
    moderate: {
      border: 'border-[var(--accent-info)]',
      bg: 'bg-cyan-50',
      badge: 'bg-[var(--accent-info)] text-white',
      label: 'Good Option'
    },
    caution: {
      border: 'border-[var(--border-medium)]',
      bg: 'bg-white',
      badge: 'bg-[var(--text-tertiary)] text-white',
      label: 'Consider Carefully'
    }
  };
  
  const style = recommendationStyles[race.recommendation];
  
  const PerformanceIcon = race.recentPerformance === 'positive' 
    ? TrendingUp 
    : race.recentPerformance === 'negative' 
    ? TrendingDown 
    : Minus;
    
  const performanceColor = race.recentPerformance === 'positive'
    ? 'text-[var(--accent-success)]'
    : race.recentPerformance === 'negative'
    ? 'text-[var(--accent-warning)]'
    : 'text-[var(--text-tertiary)]';

  return (
    <div 
      onClick={onClick}
      className={`
        p-5 rounded-lg border-2 ${style.border} ${style.bg}
        transition-all cursor-pointer hover:shadow-md
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <LicenseBadge license={race.license} />
            <h3 className="m-0">{race.seriesName}</h3>
          </div>
          <p className="text-sm m-0">{race.car}</p>
        </div>
        <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${style.badge}`}>
          {style.label}
        </div>
      </div>

      {/* Track & Next Race Time */}
      <div className="mb-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="text-[var(--text-secondary)] mb-2">{race.track}</div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="font-medium text-[var(--text-primary)]">{race.nextRace}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
            <Users className="w-4 h-4" />
            <span>{race.avgFieldSize} avg field</span>
          </div>
        </div>
      </div>

      {/* Your Performance History */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
          Your History
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <PerformanceIcon className={`w-4 h-4 ${performanceColor}`} />
            <span className="text-[var(--text-secondary)]">
              P{race.avgFinish} avg finish
            </span>
          </div>
          <div className="text-[var(--text-tertiary)]">
            {race.racesLast30Days} races (30d)
          </div>
        </div>
        
        {/* Expected Impact */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-tertiary)]">Expected:</div>
          <div className={`text-sm font-medium ${race.expectedIRatingChange >= 0 ? 'text-[var(--accent-success)]' : 'text-[var(--accent-warning)]'}`}>
            {race.expectedIRatingChange >= 0 ? '+' : ''}{race.expectedIRatingChange} iR
          </div>
          <div className="h-3 w-px bg-[var(--border-medium)]" />
          <div className={`text-sm ${
            race.srRisk === 'low' ? 'text-[var(--accent-success)]' : 
            race.srRisk === 'medium' ? 'text-[var(--accent-info)]' : 
            'text-[var(--accent-warning)]'
          }`}>
            {race.srRisk.charAt(0).toUpperCase() + race.srRisk.slice(1)} SR risk
          </div>
        </div>
      </div>
    </div>
  );
}
