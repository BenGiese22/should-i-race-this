'use client';

import { ScoreProgressBar } from '@/components/ui/ScoreProgressBar';
import type { ScoredRecommendation, RecommendationMode } from '@/lib/recommendations/types';

interface RecommendationDetailsProps {
  recommendation: ScoredRecommendation;
  mode: RecommendationMode;
  className?: string;
}

/**
 * Get weight for a factor based on mode
 */
function getFactorWeight(factor: string, mode: RecommendationMode): number {
  const weights: Record<RecommendationMode, Record<string, number>> = {
    balanced: {
      performance: 0.15,
      safety: 0.15,
      consistency: 0.15,
      predictability: 0.10,
      familiarity: 0.15,
      fatigueRisk: 0.10,
      attritionRisk: 0.10,
      timeVolatility: 0.10,
    },
    irating_push: {
      performance: 0.25,
      safety: 0.10,
      consistency: 0.10,
      predictability: 0.15,
      familiarity: 0.20,
      fatigueRisk: 0.05,
      attritionRisk: 0.10,
      timeVolatility: 0.05,
    },
    safety_recovery: {
      performance: 0.05,
      safety: 0.30,
      consistency: 0.20,
      predictability: 0.15,
      familiarity: 0.15,
      fatigueRisk: 0.05,
      attritionRisk: 0.05,
      timeVolatility: 0.05,
    },
  };

  return weights[mode]?.[factor] ?? 0.1;
}

/**
 * RecommendationDetails component
 *
 * Expanded details showing:
 * - Full scoring breakdown with weights
 * - Factor contributions to final score
 * - Mode explanation
 */
export function RecommendationDetails({
  recommendation,
  mode,
  className = '',
}: RecommendationDetailsProps) {
  const { score } = recommendation;
  const factors = score.factors;

  // Calculate contribution for each factor
  const factorDetails = [
    { key: 'performance', label: 'Performance', icon: '📈', score: factors.performance },
    { key: 'safety', label: 'Safety', icon: '🛡️', score: factors.safety },
    { key: 'consistency', label: 'Consistency', icon: '📊', score: factors.consistency },
    { key: 'predictability', label: 'Predictability', icon: '🎲', score: factors.predictability },
    { key: 'familiarity', label: 'Familiarity', icon: '🎯', score: factors.familiarity },
    { key: 'fatigueRisk', label: 'Fatigue Risk', icon: '⏱️', score: factors.fatigueRisk },
    { key: 'attritionRisk', label: 'Attrition Risk', icon: '⚠️', score: factors.attritionRisk },
    { key: 'timeVolatility', label: 'Time Volatility', icon: '📅', score: factors.timeVolatility },
  ].map((f) => ({
    ...f,
    weight: getFactorWeight(f.key, mode),
    contribution: Math.round(f.score * getFactorWeight(f.key, mode)),
  }));

  // Sort by weight (highest first for current mode)
  factorDetails.sort((a, b) => b.weight - a.weight);

  const modeDescriptions: Record<RecommendationMode, string> = {
    balanced: 'All factors weighted equally for a well-rounded recommendation.',
    irating_push: 'Performance and familiarity weighted higher. Accepts more risk for rating gains.',
    safety_recovery: 'Safety and consistency weighted higher. Minimizes incident risk.',
  };

  return (
    <div className={className}>
      {/* Mode explanation */}
      <div className="mb-4 p-3 bg-racing-blue/5 dark:bg-racing-blue/10 rounded-lg">
        <p className="text-xs text-racing-gray-600 dark:text-racing-gray-400">
          <strong className="text-racing-gray-700 dark:text-racing-gray-300">
            {mode === 'balanced' ? 'Balanced' : mode === 'irating_push' ? 'iRating Push' : 'Safety Recovery'} Mode:
          </strong>{' '}
          {modeDescriptions[mode]}
        </p>
      </div>

      {/* Scoring breakdown */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-racing-gray-700 dark:text-racing-gray-300 mb-3">
          Scoring Breakdown
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-racing-gray-500 dark:text-racing-gray-400 border-b border-racing-gray-200 dark:border-racing-gray-700">
                <th className="pb-2 pr-4">Factor</th>
                <th className="pb-2 pr-4 text-right">Score</th>
                <th className="pb-2 pr-4 text-right">Weight</th>
                <th className="pb-2 text-right">Contrib.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-racing-gray-100 dark:divide-racing-gray-800">
              {factorDetails.map((factor) => (
                <tr key={factor.key} className="text-racing-gray-700 dark:text-racing-gray-300">
                  <td className="py-2 pr-4">
                    <span className="mr-2">{factor.icon}</span>
                    {factor.label}
                  </td>
                  <td className="py-2 pr-4 text-right font-medium">{factor.score}</td>
                  <td className="py-2 pr-4 text-right text-racing-gray-500">
                    ×{factor.weight.toFixed(2)}
                  </td>
                  <td className="py-2 text-right font-semibold">{factor.contribution}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-racing-gray-200 dark:border-racing-gray-700">
                <td colSpan={3} className="py-2 pr-4 font-medium text-racing-gray-700 dark:text-racing-gray-300">
                  Final Score
                </td>
                <td className="py-2 text-right font-bold text-lg text-racing-blue">
                  {score.overall}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* All factors visualization */}
      <div>
        <h4 className="text-sm font-medium text-racing-gray-700 dark:text-racing-gray-300 mb-3">
          All Factors
        </h4>
        <div className="space-y-2">
          {factorDetails.map((factor) => (
            <ScoreProgressBar
              key={factor.key}
              value={factor.score}
              label={factor.label}
              icon={factor.icon}
              size="sm"
              showValue
            />
          ))}
        </div>
      </div>

      {/* Reasoning (if available) */}
      {score.reasoning && score.reasoning.length > 0 && (
        <div className="mt-4 pt-4 border-t border-racing-gray-200 dark:border-racing-gray-700">
          <h4 className="text-sm font-medium text-racing-gray-700 dark:text-racing-gray-300 mb-2">
            Key Insights
          </h4>
          <ul className="space-y-1">
            {score.reasoning.map((reason, index) => (
              <li
                key={index}
                className="text-xs text-racing-gray-600 dark:text-racing-gray-400 flex items-start gap-2"
              >
                <span className="text-racing-gray-400 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
