'use client';

import React, { useState } from 'react';
import { Clock, Info } from 'lucide-react';
import { LicenseBadge, LicenseClass } from './LicenseBadge';

export interface SecondaryRecommendation {
  id: string;
  seriesName: string;
  track: string;
  license: LicenseClass;
  
  // Schedule
  nextRaceTime: string; // e.g., "6:00 PM"
  sessionLength: string; // e.g., "20 min"
  raceType: 'Fixed' | 'Open';
  frequency: string; // e.g., "Every 2 hours" or "Daily"
  timezone: string; // e.g., "EST"
  
  // Confidence & Risk
  confidence: number; // 0-100
  risk: 'low' | 'moderate' | 'elevated';
  
  // Top Factors (1-2 only)
  topFactors: {
    label: string;
    value: number;
    color: 'positive' | 'caution' | 'neutral';
  }[];
  
  // Lightweight trust affordance
  whyGoodOption?: string[]; // 2-3 concise human-readable reasons
}

interface SecondaryRecommendationCardProps {
  recommendation: SecondaryRecommendation;
  onClick?: () => void;
}

export function SecondaryRecommendationCard({ recommendation, onClick }: SecondaryRecommendationCardProps) {
  const [showReason, setShowReason] = useState(false);
  
  const riskColors = {
    low: 'var(--semantic-positive)',
    moderate: 'var(--semantic-caution)',
    elevated: 'var(--semantic-danger)'
  };
  
  const riskBgColors = {
    low: 'var(--semantic-positive-bg)',
    moderate: 'var(--semantic-caution-bg)',
    elevated: 'var(--semantic-danger-bg)'
  };
  
  const factorColors = {
    positive: 'var(--semantic-positive)',
    caution: 'var(--semantic-caution)',
    neutral: 'var(--accent-info)'
  };
  
  const factorBgColors = {
    positive: 'var(--semantic-positive-bg)',
    caution: 'var(--semantic-caution-bg)',
    neutral: 'var(--accent-info-bg)'
  };
  
  return (
    <div
      onClick={onClick}
      className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4 hover:border-[var(--border-medium)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
    >
      {/* Identity */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1 leading-snug">
            {recommendation.seriesName}
          </h3>
          <h4 className="text-sm text-[var(--text-secondary)] leading-snug">
            {recommendation.track}
          </h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-tertiary)] font-medium">
            {recommendation.raceType}
          </span>
          <LicenseBadge license={recommendation.license} variant="compact" />
        </div>
      </div>
      
      {/* Schedule (Compact) */}
      <div className="mb-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5 mb-1">
          <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {recommendation.nextRaceTime}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {recommendation.timezone}
          </span>
        </div>
        <div className="text-xs text-[var(--text-tertiary)] ml-5">
          {recommendation.sessionLength} • {recommendation.frequency}
        </div>
      </div>
      
      {/* Confidence & Risk */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="text-xs text-[var(--text-tertiary)] mb-1">Confidence</div>
          <div className="text-base font-semibold stat-number text-[var(--text-primary)]">
            {recommendation.confidence}%
          </div>
        </div>
        <div 
          className="px-2.5 py-1.5 rounded-md"
          style={{ backgroundColor: riskBgColors[recommendation.risk] }}
        >
          <div className="text-xs text-[var(--text-tertiary)] mb-0.5">Safety Risk</div>
          <div 
            className="text-xs font-semibold capitalize"
            style={{ color: riskColors[recommendation.risk] }}
          >
            {recommendation.risk}
          </div>
        </div>
      </div>
      
      {/* Top Factors (1-2 only) */}
      <div className="space-y-2">
        {recommendation.topFactors.map((factor, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">{factor.label}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${factor.value}%`,
                    backgroundColor: factorColors[factor.color]
                  }}
                />
              </div>
              <span 
                className="text-xs font-semibold stat-number w-8 text-right"
                style={{ color: factorColors[factor.color] }}
              >
                {factor.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Lightweight Trust Affordance */}
      {recommendation.whyGoodOption && recommendation.whyGoodOption.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReason(!showReason);
            }}
            className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Why this works for you</span>
          </button>
          
          {showReason && (
            <div className="mt-2 pl-5 space-y-1.5">
              {recommendation.whyGoodOption.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[var(--text-tertiary)] mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
