import React, { useState } from 'react';
import { Clock, Calendar, ChevronDown, ChevronUp, Gauge, Lock } from 'lucide-react';
import { LicenseBadge, LicenseClass } from './LicenseBadge';
import { ProUpgradePrompt } from './ProUpgradePrompt';
import { LimitedHistoryBadge } from './LimitedHistoryBadge';
import { UpdatedTag } from './UpdatedTag';
import { ConfidenceChangeIndicator } from './ConfidenceChangeIndicator';

export interface PrimaryRecommendation {
  id: string;
  seriesName: string;
  track: string;
  license: LicenseClass;
  
  // Schedule - First Class
  nextRaceTime: string; // e.g., "Today 6:00 PM"
  nextRaceDate: string; // e.g., "Feb 9"
  sessionLength: string; // e.g., "20 min"
  raceType: 'Fixed' | 'Open';
  frequency: string; // e.g., "Every 2 hours"
  timezone: string;
  
  // Personal Context
  userRaceCount: number;
  avgPositionDelta: number; // +3.2 means gaining positions
  avgIncidents: number;
  
  // Why This Race - Factors
  factors: {
    label: string;
    value: number;
    color: 'positive' | 'caution' | 'neutral';
    description: string;
  }[];
  
  // Confidence
  confidence: number; // 0-100
  
  // Expanded Details
  modeExplanation: string;
  scoringBreakdown: {
    factor: string;
    score: number;
    weight: number;
    contribution: number;
  }[];
  insights: string[];
}

interface PrimaryRecommendationCardProps {
  recommendation: PrimaryRecommendation;
  isProUser?: boolean;
  showUpdatedTag?: boolean;
  updatedMessage?: string;
  showConfidenceChange?: boolean;
  previousConfidence?: number;
  confidenceChangeReason?: string;
}

function FactorBar({ 
  label, 
  value, 
  color, 
  description 
}: { 
  label: string; 
  value: number; 
  color: 'positive' | 'caution' | 'neutral';
  description: string;
}) {
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
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex-1">
          <div className="text-[var(--text-primary)] font-medium mb-1">{label}</div>
          <div className="text-sm text-[var(--text-secondary)]">{description}</div>
        </div>
        <div className="text-lg font-semibold stat-number ml-4" style={{ color: barColors[color] }}>
          {value}%
        </div>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: bgColors[color] }}>
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${value}%`,
            backgroundColor: barColors[color]
          }}
        />
      </div>
    </div>
  );
}

export function PrimaryRecommendationCard({ recommendation, isProUser, showUpdatedTag, updatedMessage, showConfidenceChange, previousConfidence, confidenceChangeReason }: PrimaryRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-[var(--bg-surface)] border-2 border-[var(--accent-primary)] rounded-xl shadow-xl shadow-[var(--accent-primary-glow)]">
      
      {/* Top Label */}
      <div className="px-8 pt-6 pb-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary-glow)] rounded-lg">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span className="text-sm font-semibold text-[var(--accent-primary-bright)]">
              Top Pick for You
            </span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            This race aligns well with your recent performance
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-8 py-8 space-y-8">
        
        {/* 1. IDENTITY (MOST IMPORTANT) */}
        <div>
          <div className="flex items-center justify-between gap-6">
            {/* Left: Series + Track */}
            <div className="flex-1 min-w-0 space-y-3">
              <h2 className="text-2xl font-semibold leading-tight text-[var(--text-primary)]">
                {recommendation.seriesName}
              </h2>
              <h3 className="text-lg text-[var(--text-secondary)]">
                {recommendation.track}
              </h3>
            </div>
            
            {/* Right: License Badge + Setup Type */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="px-2.5 py-1 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-md">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {recommendation.raceType} Setup
                </span>
              </div>
              <LicenseBadge license={recommendation.license} />
            </div>
          </div>
        </div>
        
        {/* 3. SCHEDULE (FIRST-CLASS INFORMATION) */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Next Race Time */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-[var(--accent-primary)]" />
                <span className="label-metadata text-[var(--text-tertiary)]">Next Race</span>
              </div>
              <div className="text-3xl font-bold stat-number text-[var(--accent-primary)] mb-1.5">
                {recommendation.nextRaceTime}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                {recommendation.nextRaceDate} • {recommendation.timezone}
              </div>
            </div>
            
            {/* Session Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-[var(--accent-info)]" />
                <span className="label-metadata text-[var(--text-tertiary)]">Session Info</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-[var(--text-tertiary)]">Length:</span>
                  <span className="text-base font-semibold text-[var(--text-primary)]">
                    {recommendation.sessionLength}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-[var(--text-tertiary)]">Frequency:</span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {recommendation.frequency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 4. PERSONAL HISTORY (TRUST ANCHOR) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="label-metadata">Your History in This Series</div>
            <LimitedHistoryBadge raceCount={recommendation.userRaceCount} threshold={5} />
          </div>
          <div className="bg-[var(--bg-elevated)] rounded-lg px-5 py-4">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-sm text-[var(--text-tertiary)] mb-1">Races Completed</div>
                <div className="text-2xl font-bold stat-number text-[var(--text-primary)]">
                  {recommendation.userRaceCount}
                </div>
              </div>
              
              <div className="h-12 w-px bg-[var(--border-medium)]" />
              
              <div>
                <div className="text-sm text-[var(--text-tertiary)] mb-1">Position Change</div>
                <div 
                  className="text-2xl font-bold stat-number"
                  style={{ 
                    color: recommendation.avgPositionDelta > 0 
                      ? 'var(--semantic-positive)' 
                      : recommendation.avgPositionDelta < 0
                      ? 'var(--semantic-caution)'
                      : 'var(--text-primary)' 
                  }}
                >
                  {recommendation.avgPositionDelta > 0 ? '+' : ''}{recommendation.avgPositionDelta.toFixed(1)}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5">avg per race</div>
              </div>
              
              <div className="h-12 w-px bg-[var(--border-medium)]" />
              
              <div>
                <div className="text-sm text-[var(--text-tertiary)] mb-1">Incidents</div>
                <div 
                  className="text-2xl font-bold stat-number"
                  style={{ 
                    color: recommendation.avgIncidents < 2 
                      ? 'var(--semantic-positive)' 
                      : recommendation.avgIncidents < 4 
                      ? 'var(--semantic-caution)' 
                      : 'var(--semantic-danger)' 
                  }}
                >
                  {recommendation.avgIncidents.toFixed(1)}x
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5">avg per race</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-[var(--text-tertiary)] mt-3 leading-relaxed">
            Based on {recommendation.userRaceCount} races you've completed in this series.
          </p>
          {/* Data-driven positive reinforcement */}
          {recommendation.avgPositionDelta > 2 && (
            <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
              You tend to finish higher than average in this series.
            </p>
          )}
          {recommendation.avgIncidents < 2.5 && recommendation.avgPositionDelta <= 2 && (
            <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
              Your incident rate here is lower than usual.
            </p>
          )}
        </div>
        
        {/* 5. WHY THIS RACE (CORE JUSTIFICATION) */}
        <div>
          <div className="label-metadata mb-5">Why This Race</div>
          <div className="space-y-6">
            {recommendation.factors.map((factor, idx) => (
              <FactorBar 
                key={idx}
                label={factor.label}
                value={factor.value}
                color={factor.color}
                description={factor.description}
              />
            ))}
          </div>
        </div>
        
        {/* 6. CONFIDENCE SIGNAL */}
        <div className="flex items-center justify-between pt-6 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-primary-glow)] rounded-lg">
              <Gauge className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <div className="text-sm text-[var(--text-tertiary)]">Recommendation Confidence</div>
              <div className="flex items-center gap-3 mt-1">
                <div className="text-lg font-semibold stat-number text-[var(--text-primary)]">
                  {recommendation.confidence}%
                </div>
                {/* Confidence Change Indicator - inline */}
                {showConfidenceChange && previousConfidence && (
                  <ConfidenceChangeIndicator 
                    previousValue={previousConfidence} 
                    currentValue={recommendation.confidence} 
                    reason={confidenceChangeReason} 
                  />
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-[var(--text-tertiary)] max-w-xs text-right leading-relaxed">
            Reflects how often races like this have gone well for you
          </div>
        </div>
        
        {/* 7. UPDATED TAG */}
        {showUpdatedTag && (
          <div className="pt-4">
            <UpdatedTag message={updatedMessage} />
          </div>
        )}
      </div>
      
      {/* 8. VIEW DETAILS ACTION */}
      <div className="px-8 pb-8">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg hover:bg-[var(--bg-hover)] hover:border-[var(--border-emphasis)] transition-all group"
        >
          <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
            {isExpanded ? 'Hide Detailed Analysis' : 'View Detailed Analysis'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]" />
          )}
        </button>
      </div>
      
      {/* EXPANDED STATE (VIEW DETAILS) */}
      {isExpanded && (
        <div className="px-8 pb-8 pt-0">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-xl p-6 space-y-8">
            
            {/* Mode Explanation */}
            <div>
              <h3 className="mb-3">About This Recommendation</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {recommendation.modeExplanation}
              </p>
            </div>
            
            {/* Scoring Breakdown Table - GATED FOR EXPLORER */}
            {isProUser ? (
              <div>
                <h3 className="mb-4">Scoring Breakdown</h3>
                <div className="overflow-hidden rounded-lg border border-[var(--border-medium)]">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-medium)]">
                        <th className="text-left px-5 py-3.5 text-sm font-semibold text-[var(--text-secondary)]">
                          Factor
                        </th>
                        <th className="text-right px-5 py-3.5 text-sm font-semibold text-[var(--text-secondary)] stat-number">
                          Score
                        </th>
                        <th className="text-right px-5 py-3.5 text-sm font-semibold text-[var(--text-secondary)] stat-number">
                          Weight
                        </th>
                        <th className="text-right px-5 py-3.5 text-sm font-semibold text-[var(--text-secondary)] stat-number">
                          Contribution
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendation.scoringBreakdown.map((row, idx) => (
                        <tr 
                          key={idx}
                          className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <td className="px-5 py-4 text-sm text-[var(--text-primary)]">
                            {row.factor}
                          </td>
                          <td className="px-5 py-4 text-sm text-right stat-number text-[var(--text-secondary)]">
                            {row.score}
                          </td>
                          <td className="px-5 py-4 text-sm text-right stat-number text-[var(--text-secondary)]">
                            {row.weight}x
                          </td>
                          <td className="px-5 py-4 text-sm text-right stat-number font-semibold text-[var(--accent-primary)]">
                            {row.contribution}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="mb-4">Scoring Breakdown</h3>
                <div className="relative">
                  <div className="overflow-hidden rounded-lg border border-[var(--border-medium)] blur-sm opacity-50 select-none pointer-events-none">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-medium)]">
                          <th className="text-left px-5 py-3.5 text-sm font-semibold text-[var(--text-secondary)]">
                            Factor
                          </th>
                          <th className="text-right px-5 py-3.5 text-sm font-semibold text-[var(--text-secondary)] stat-number">
                            Score
                          </th>
                          <th className="text-right px-5 py-3.5 text-sm font-semibold text-[var(--text-secondary)] stat-number">
                            Weight
                          </th>
                          <th className="text-right px-5 py-3.5 text-sm font-semibold text-[var(--text-secondary)] stat-number">
                            Contribution
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendation.scoringBreakdown.map((row, idx) => (
                          <tr key={idx} className="border-b border-[var(--border-subtle)] last:border-b-0">
                            <td className="px-5 py-4 text-sm text-[var(--text-primary)]">
                              {row.factor}
                            </td>
                            <td className="px-5 py-4 text-sm text-right stat-number text-[var(--text-secondary)]">
                              {row.score}
                            </td>
                            <td className="px-5 py-4 text-sm text-right stat-number text-[var(--text-secondary)]">
                              {row.weight}x
                            </td>
                            <td className="px-5 py-4 text-sm text-right stat-number font-semibold text-[var(--accent-primary)]">
                              {row.contribution}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ProUpgradePrompt 
                      feature="Full Scoring Breakdown"
                      description="See exactly how each factor contributes to this recommendation"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Key Insights - GATED FOR EXPLORER */}
            {isProUser ? (
              <div>
                <h3 className="mb-4">Key Insights</h3>
                <div className="space-y-3">
                  {recommendation.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2.5 flex-shrink-0" />
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="mb-4">Key Insights</h3>
                <div className="relative">
                  <div className="space-y-3 blur-sm opacity-50 select-none pointer-events-none">
                    {recommendation.insights.slice(0, 2).map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2.5 flex-shrink-0" />
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
                          {insight}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ProUpgradePrompt 
                      feature="Algorithm Insights"
                      description="Unlock deeper explanations about why this score changes"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}