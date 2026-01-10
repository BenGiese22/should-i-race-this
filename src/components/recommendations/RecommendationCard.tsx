'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RacingProgress } from '@/components/ui/racing-progress';
import { RacingBadgeComponent, ConfidenceBadgeComponent } from '@/components/ui/racing-badge';
import { ScoredOpportunity, ScoredRecommendation, RiskLevel } from '@/lib/recommendations/types';
import { visualScoringRenderer } from '@/lib/recommendations/visual-scoring';
import { Flag, AlertTriangle, ChevronDown, Lightbulb } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: ScoredOpportunity | ScoredRecommendation;
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

export function RecommendationCard({ recommendation, onSelect }: RecommendationCardProps) {
  const { score } = recommendation;
  
  // Check if this is a ScoredRecommendation with visual indicators or legacy ScoredOpportunity
  const hasVisualIndicators = 'visualIndicators' in recommendation;
  const visualIndicators = hasVisualIndicators 
    ? recommendation.visualIndicators 
    : visualScoringRenderer.renderVisualScoring(score);

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer racing-card h-full flex flex-col"
      onClick={() => onSelect?.(recommendation)}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Primary heading - Series name with consistent typography */}
            <CardTitle className="text-lg font-bold text-gray-900 leading-tight truncate">
              {recommendation.seriesName}
            </CardTitle>
            {/* Secondary information - Track name with consistent spacing */}
            <p className="text-sm font-medium text-gray-700 mt-2 truncate">
              {recommendation.trackName}
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-2 flex-shrink-0">
            {/* Overall Racing Badge - consistent sizing */}
            <RacingBadgeComponent 
              badge={visualIndicators.overall} 
              className="text-xs"
            />
            
            {/* Confidence Indicators - standardized sizing */}
            <ConfidenceBadgeComponent 
              badge={visualScoringRenderer.renderConfidenceBadge(
                score.dataConfidence?.performance || 'no_data'
              )}
              className="text-xs px-2 py-1"
            />
          </div>
        </div>
        
        {/* Badges with consistent spacing and responsive wrapping */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Badge variant="outline" className="text-xs px-2 py-1 racing-category-badge">
            {recommendation.category.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-1 racing-license-badge">
            {recommendation.licenseRequired.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-1 racing-duration-badge">
            {recommendation.raceLength}min
          </Badge>
          {recommendation.hasOpenSetup && (
            <Badge variant="secondary" className="text-xs px-2 py-1 racing-setup-badge">
              Open Setup
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1">
        {/* Racing-themed Factor Scores with consistent spacing */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Performance Factors
          </h4>
          
          {/* Primary Performance Factors with consistent grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-600 font-medium">
                Performance
              </div>
              <RacingProgress 
                progressBar={visualIndicators.performance} 
                className="flex-1"
                showIcon={false}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-600 font-medium">
                Safety
              </div>
              <RacingProgress 
                progressBar={visualIndicators.safety} 
                className="flex-1"
                showIcon={false}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-600 font-medium">
                Consistency
              </div>
              <RacingProgress 
                progressBar={visualIndicators.consistency} 
                className="flex-1"
                showIcon={false}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-20 text-xs text-gray-600 font-medium">
                Familiarity
              </div>
              <RacingProgress 
                progressBar={visualIndicators.familiarity} 
                className="flex-1"
                showIcon={false}
              />
            </div>
          </div>
          
          {/* Secondary Risk Factors - Collapsible with consistent styling */}
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-2 py-2">
              <AlertTriangle className="w-3 h-3" />
              <span>Risk Analysis</span>
              <ChevronDown className="w-3 h-3 ml-auto" />
            </summary>
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600">
                  Predictability
                </div>
                <RacingProgress 
                  progressBar={visualIndicators.predictability} 
                  className="flex-1"
                  showIcon={false}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600">
                  Attrition Risk
                </div>
                <RacingProgress 
                  progressBar={visualIndicators.attritionRisk} 
                  className="flex-1"
                  showIcon={false}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600">
                  Fatigue Risk
                </div>
                <RacingProgress 
                  progressBar={visualIndicators.fatigueRisk} 
                  className="flex-1"
                  showIcon={false}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-20 text-xs text-gray-600">
                  Time Volatility
                </div>
                <RacingProgress 
                  progressBar={visualIndicators.timeVolatility} 
                  className="flex-1"
                  showIcon={false}
                />
              </div>
            </div>
          </details>
        </div>

        {/* Legacy Risk Indicators with consistent spacing */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">iRating Risk:</span>
            <Badge variant={getRiskColor(score.iRatingRisk)} className="text-xs px-2 py-1">
              {score.iRatingRisk.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Safety Risk:</span>
            <Badge variant={getRiskColor(score.safetyRatingRisk)} className="text-xs px-2 py-1">
              {score.safetyRatingRisk.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Key Insights with consistent styling */}
        {score.reasoning && score.reasoning.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Key Insights
            </h4>
            <ul className="text-xs text-gray-600 space-y-2">
              {score.reasoning.slice(0, 3).map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}