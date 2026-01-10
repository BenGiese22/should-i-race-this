'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RacingProgress } from '@/components/ui/racing-progress';
import { RacingBadgeComponent, ConfidenceBadgeComponent } from '@/components/ui/racing-badge';
import { ScoredOpportunity, ScoredRecommendation, RiskLevel } from '@/lib/recommendations/types';
import { visualScoringRenderer } from '@/lib/recommendations/visual-scoring';
import { Flag, Lightbulb, BarChart3 } from 'lucide-react';

interface RecommendationDetailProps {
  recommendation: ScoredOpportunity | ScoredRecommendation;
  onClose: () => void;
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

export function RecommendationDetail({ recommendation, onClose }: RecommendationDetailProps) {
  const { score } = recommendation;
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Check if this is a ScoredRecommendation with visual indicators or legacy ScoredOpportunity
  const hasVisualIndicators = 'visualIndicators' in recommendation;
  const visualIndicators = hasVisualIndicators 
    ? recommendation.visualIndicators 
    : visualScoringRenderer.renderVisualScoring(score);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <Card 
        ref={modalRef}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl border border-gray-200"
      >
        <CardHeader className="border-b bg-white sticky top-0 z-10">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {recommendation.seriesName}
              </CardTitle>
              <p className="text-base sm:text-lg text-gray-600 mt-1 truncate">
                {recommendation.trackName}
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-3 flex-shrink-0">
              <RacingBadgeComponent badge={visualIndicators.overall} />
              <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(score.overall)}`}>
                {Math.round(score.overall)}
              </div>
              <div className="text-sm text-gray-500">Overall Score</div>
              
              {/* Confidence Indicators */}
              <ConfidenceBadgeComponent 
                badge={visualScoringRenderer.renderConfidenceBadge(
                  score.dataConfidence?.performance || 'no_data'
                )} 
              />
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClose}
                className="mt-2"
                aria-label="Close modal"
              >
                Close
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="racing-category-badge text-xs px-2 py-1">
              {recommendation.category.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline" className="racing-license-badge text-xs px-2 py-1">
              License: {recommendation.licenseRequired.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="racing-duration-badge text-xs px-2 py-1">
              {recommendation.raceLength} minutes
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-1">
              Season {recommendation.seasonYear}Q{recommendation.seasonQuarter}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-1">
              Week {recommendation.raceWeekNum + 1}
            </Badge>
            {recommendation.hasOpenSetup && (
              <Badge variant="secondary" className="racing-setup-badge text-xs px-2 py-1">
                Open Setup
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 bg-white">
          {/* Risk Assessment with improved mobile layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">iRating Risk</span>
                    <Badge variant={getRiskColor(score.iRatingRisk)} className="text-xs px-2 py-1">
                      {score.iRatingRisk.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Safety Rating Risk</span>
                    <Badge variant={getRiskColor(score.safetyRatingRisk)} className="text-xs px-2 py-1">
                      {score.safetyRatingRisk.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Race Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Series ID:</span>
                    <span className="font-medium">{recommendation.seriesId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Track ID:</span>
                    <span className="font-medium">{recommendation.trackId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Race Length:</span>
                    <span className="font-medium">{recommendation.raceLength} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Setup Type:</span>
                    <span className="font-medium">
                      {recommendation.hasOpenSetup ? 'Open Setup' : 'Fixed Setup'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Factor Breakdown with improved mobile layout */}
          <Card className="mb-4 sm:mb-6">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Performance Factor Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Primary Performance Factors */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 mb-3">Core Performance</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Performance</span>
                        <span className={`font-bold ${getScoreColor(score.factors.performance)}`}>
                          {Math.round(score.factors.performance)}
                        </span>
                      </div>
                      <RacingProgress 
                        progressBar={visualIndicators.performance}
                        showIcon={true}
                        showValue={false}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Safety</span>
                        <span className={`font-bold ${getScoreColor(score.factors.safety)}`}>
                          {Math.round(score.factors.safety)}
                        </span>
                      </div>
                      <RacingProgress 
                        progressBar={visualIndicators.safety}
                        showIcon={true}
                        showValue={false}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Consistency</span>
                        <span className={`font-bold ${getScoreColor(score.factors.consistency)}`}>
                          {Math.round(score.factors.consistency)}
                        </span>
                      </div>
                      <RacingProgress 
                        progressBar={visualIndicators.consistency}
                        showIcon={true}
                        showValue={false}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Familiarity</span>
                        <span className={`font-bold ${getScoreColor(score.factors.familiarity)}`}>
                          {Math.round(score.factors.familiarity)}
                        </span>
                      </div>
                      <RacingProgress 
                        progressBar={visualIndicators.familiarity}
                        showIcon={true}
                        showValue={false}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Risk Analysis Factors */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 mb-3">Risk Analysis</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Predictability</span>
                        <span className={`font-bold ${getScoreColor(score.factors.predictability)}`}>
                          {Math.round(score.factors.predictability)}
                        </span>
                      </div>
                      <RacingProgress 
                        progressBar={visualIndicators.predictability}
                        showIcon={true}
                        showValue={false}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Attrition Risk</span>
                        <span className={`font-bold ${getScoreColor(score.factors.attritionRisk)}`}>
                          {Math.round(score.factors.attritionRisk)}
                        </span>
                      </div>
                      <RacingProgress 
                        progressBar={visualIndicators.attritionRisk}
                        showIcon={true}
                        showValue={false}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Fatigue Risk</span>
                        <span className={`font-bold ${getScoreColor(score.factors.fatigueRisk)}`}>
                          {Math.round(score.factors.fatigueRisk)}
                        </span>
                      </div>
                      <RacingProgress 
                        progressBar={visualIndicators.fatigueRisk}
                        showIcon={true}
                        showValue={false}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Time Volatility</span>
                        <span className={`font-bold ${getScoreColor(score.factors.timeVolatility)}`}>
                          {Math.round(score.factors.timeVolatility)}
                        </span>
                      </div>
                      <RacingProgress 
                        progressBar={visualIndicators.timeVolatility}
                        showIcon={true}
                        showValue={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          {score.reasoning && score.reasoning.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Key Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {score.reasoning.map((reason, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Global Stats with improved mobile layout */}
          {recommendation.globalStats && (
            <Card className="mt-4 sm:mt-6">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Series Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-bold text-lg text-gray-900">
                      {recommendation.globalStats.avgIncidentsPerRace.toFixed(1)}
                    </div>
                    <div className="text-gray-600 text-xs">Avg Incidents</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-bold text-lg text-gray-900">
                      {recommendation.globalStats.avgStrengthOfField.toFixed(0)}
                    </div>
                    <div className="text-gray-600 text-xs">Avg SOF</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-bold text-lg text-gray-900">
                      {(recommendation.globalStats.attritionRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-600 text-xs">Attrition Rate</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-bold text-lg text-gray-900">
                      {recommendation.globalStats.strengthOfFieldVariability.toFixed(0)}
                    </div>
                    <div className="text-gray-600 text-xs">SOF Variability</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}