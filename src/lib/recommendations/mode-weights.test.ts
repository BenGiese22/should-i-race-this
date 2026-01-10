/**
 * Unit tests for mode-based weighting system
 * Validates that weights are properly configured for each mode
 */

import { describe, test, expect } from '@jest/globals';
import { ScoringAlgorithm } from './scoring';
import { RecommendationMode } from './types';

describe('Mode-Based Weighting System', () => {
  const scoringAlgorithm = new ScoringAlgorithm();

  test('All mode weights sum to 1.0', () => {
    const modes: RecommendationMode[] = ['balanced', 'irating_push', 'safety_recovery'];
    
    modes.forEach(mode => {
      // Access the private method through reflection for testing
      const weights = (scoringAlgorithm as any).getModeWeights(mode);
      
      const sum = 
        weights.performance +
        weights.safety +
        weights.consistency +
        weights.predictability +
        weights.familiarity +
        weights.fatigueRisk +
        weights.attritionRisk +
        weights.timeVolatility;
      
      expect(sum).toBeCloseTo(1.0, 5); // Allow for floating point precision
    });
  });

  test('iRating push mode prioritizes performance and familiarity', () => {
    const weights = (scoringAlgorithm as any).getModeWeights('irating_push');
    const balancedWeights = (scoringAlgorithm as any).getModeWeights('balanced');
    
    // Performance should have higher weight in iRating push mode
    expect(weights.performance).toBeGreaterThan(balancedWeights.performance);
    
    // Familiarity should have higher weight in iRating push mode
    expect(weights.familiarity).toBeGreaterThan(balancedWeights.familiarity);
    
    // Safety should have lower weight in iRating push mode
    expect(weights.safety).toBeLessThan(balancedWeights.safety);
  });

  test('Safety recovery mode prioritizes safety and consistency', () => {
    const weights = (scoringAlgorithm as any).getModeWeights('safety_recovery');
    const balancedWeights = (scoringAlgorithm as any).getModeWeights('balanced');
    
    // Safety should have much higher weight in safety recovery mode
    expect(weights.safety).toBeGreaterThan(balancedWeights.safety);
    expect(weights.safety).toBeGreaterThanOrEqual(0.25); // At least 25%
    
    // Consistency should have higher weight in safety recovery mode
    expect(weights.consistency).toBeGreaterThan(balancedWeights.consistency);
    
    // Performance should have lower weight in safety recovery mode
    expect(weights.performance).toBeLessThan(balancedWeights.performance);
  });

  test('Balanced mode has reasonable weight distribution', () => {
    const weights = (scoringAlgorithm as any).getModeWeights('balanced');
    
    // No single factor should dominate (max 20%)
    Object.values(weights).forEach(weight => {
      expect(weight).toBeLessThanOrEqual(0.20);
    });
    
    // Core factors should have meaningful weight (at least 10%)
    expect(weights.performance).toBeGreaterThanOrEqual(0.10);
    expect(weights.safety).toBeGreaterThanOrEqual(0.10);
    expect(weights.consistency).toBeGreaterThanOrEqual(0.10);
    expect(weights.familiarity).toBeGreaterThanOrEqual(0.10);
  });
});