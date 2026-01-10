'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RacingBadgeComponent } from '@/components/ui/racing-badge';
import { ScoredOpportunity, ScoredRecommendation, RiskLevel } from '@/lib/recommendations/types';
import { visualScoringRenderer } from '@/lib/recommendations/visual-scoring';

interface RecommendationTableProps {
  recommendations: (ScoredOpportunity | ScoredRecommendation)[];
  onSelect?: (recommendation: ScoredOpportunity | ScoredRecommendation) => void;
}

const getRiskColor = (risk: RiskLevel) => {
  switch (risk) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'danger';
    default:
      return 'secondary';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

// Get the solid color for a score using the same logic as visual scoring
const getScoreColorStyle = (score: number): string => {
  const clampedScore = Math.max(0, Math.min(100, score));
  
  const startColor = '#ff4444'; // Red
  const midColor = '#ffaa44';   // Orange
  const endColor = '#44ff44';   // Green
  
  let currentColor: string;
  
  if (clampedScore <= 33) {
    // Red zone (0-33)
    const ratio = clampedScore / 33;
    currentColor = interpolateColor(startColor, '#ff6644', ratio);
  } else if (clampedScore <= 66) {
    // Orange zone (34-66)
    const ratio = (clampedScore - 33) / 33;
    currentColor = interpolateColor('#ff6644', midColor, ratio);
  } else {
    // Green zone (67-100)
    const ratio = (clampedScore - 66) / 34;
    currentColor = interpolateColor(midColor, endColor, ratio);
  }
  
  return currentColor;
};

// Helper function to interpolate between two hex colors
const interpolateColor = (color1: string, color2: string, ratio: number): string => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export function RecommendationTable({ recommendations, onSelect }: RecommendationTableProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No recommendations available</div>
        <div className="text-gray-400 text-sm">
          Try adjusting your filters or check back after more race data is available.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-700">Series & Track</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Score</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">iRating Risk</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Safety Risk</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Performance</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Safety</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Consistency</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Familiarity</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Details</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map((recommendation) => {
            // Check if this is a ScoredRecommendation with visual indicators or legacy ScoredOpportunity
            const hasVisualIndicators = 'visualIndicators' in recommendation;
            const visualIndicators = hasVisualIndicators 
              ? recommendation.visualIndicators 
              : visualScoringRenderer.renderVisualScoring(recommendation.score);

            return (
              <tr 
                key={`${recommendation.seriesId}-${recommendation.trackId}-${recommendation.raceWeekNum}`}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelect?.(recommendation)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.(recommendation);
                  }
                }}
                tabIndex={0}
              >
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-gray-900">
                      {recommendation.seriesName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {recommendation.trackName}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs racing-category-badge">
                        {recommendation.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs racing-license-badge">
                        {recommendation.licenseRequired.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </td>
                
                <td className="py-4 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <RacingBadgeComponent badge={visualIndicators.overall} />
                    <div className={`text-sm font-medium ${getScoreColor(recommendation.score.overall)}`}>
                      {Math.round(recommendation.score.overall)}
                    </div>
                  </div>
                </td>
                
                <td className="py-4 px-4 text-center">
                  <Badge variant={getRiskColor(recommendation.score.iRatingRisk)} className="text-xs">
                    {recommendation.score.iRatingRisk.toUpperCase()}
                  </Badge>
                </td>
                
                <td className="py-4 px-4 text-center">
                  <Badge variant={getRiskColor(recommendation.score.safetyRatingRisk)} className="text-xs">
                    {recommendation.score.safetyRatingRisk.toUpperCase()}
                  </Badge>
                </td>
                
                <td className="py-4 px-4 text-center">
                  <div 
                    className="text-sm font-medium"
                    style={{ color: getScoreColorStyle(visualIndicators.performance.value) }}
                  >
                    {Math.round(visualIndicators.performance.value)}
                  </div>
                </td>
                
                <td className="py-4 px-4 text-center">
                  <div 
                    className="text-sm font-medium"
                    style={{ color: getScoreColorStyle(visualIndicators.safety.value) }}
                  >
                    {Math.round(visualIndicators.safety.value)}
                  </div>
                </td>
                
                <td className="py-4 px-4 text-center">
                  <div 
                    className="text-sm font-medium"
                    style={{ color: getScoreColorStyle(visualIndicators.consistency.value) }}
                  >
                    {Math.round(visualIndicators.consistency.value)}
                  </div>
                </td>
                
                <td className="py-4 px-4 text-center">
                  <div 
                    className="text-sm font-medium"
                    style={{ color: getScoreColorStyle(visualIndicators.familiarity.value) }}
                  >
                    {Math.round(visualIndicators.familiarity.value)}
                  </div>
                </td>
                
                <td className="py-4 px-4 text-center">
                  <div className="flex gap-1 justify-center">
                    <Badge variant="outline" className="text-xs racing-duration-badge">
                      {recommendation.raceLength}min
                    </Badge>
                    {recommendation.hasOpenSetup && (
                      <Badge variant="secondary" className="text-xs racing-setup-badge">
                        Open
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}