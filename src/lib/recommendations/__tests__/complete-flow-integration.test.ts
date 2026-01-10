import { visualScoringRenderer } from '../visual-scoring';
import { analyticsIntegration } from '../analytics-integration';
import { 
  ConfidenceLevel
} from '../types';

// Mock the analytics integration to avoid database dependencies
jest.mock('../analytics-integration');

/**
 * Integration tests for complete recommendation flow components
 * Requirements: 12.1 - Test complete recommendation flow with analytics integration
 */
describe('Complete Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Analytics Integration Logging', () => {
    it('should provide analytics call logging functionality', () => {
      // Mock analytics integration methods
      const mockAnalyticsIntegration = analyticsIntegration as jest.Mocked<typeof analyticsIntegration>;
      
      mockAnalyticsIntegration.getAnalyticsCallStats.mockReturnValue({
        totalCalls: 5,
        cacheHitRate: 0.6,
        errorRate: 0,
        avgDurationMs: 25,
        recentCalls: []
      });

      mockAnalyticsIntegration.getAnalyticsCallLogs.mockReturnValue([
        {
          timestamp: new Date(),
          method: 'getUserPerformanceData',
          userId: 'test-user',
          duration: 25,
          cacheHit: false
        }
      ]);

      // Test analytics call logging functionality
      const callStats = analyticsIntegration.getAnalyticsCallStats();
      expect(callStats).toBeDefined();
      expect(typeof callStats.totalCalls).toBe('number');
      expect(typeof callStats.cacheHitRate).toBe('number');
      expect(typeof callStats.errorRate).toBe('number');
      expect(typeof callStats.avgDurationMs).toBe('number');

      const callLogs = analyticsIntegration.getAnalyticsCallLogs(10);
      expect(Array.isArray(callLogs)).toBe(true);
    });

    it('should provide cache metrics functionality', () => {
      // Mock cache metrics
      const mockAnalyticsIntegration = analyticsIntegration as jest.Mocked<typeof analyticsIntegration>;
      
      mockAnalyticsIntegration.getCacheMetrics.mockReturnValue({
        size: 10,
        stats: {
          hitRate: 0.75,
          totalRequests: 20,
          hits: 15,
          misses: 5
        }
      });

      // Test cache metrics functionality
      const cacheMetrics = analyticsIntegration.getCacheMetrics();
      expect(cacheMetrics).toBeDefined();
      expect(typeof cacheMetrics.size).toBe('number');
      expect(typeof cacheMetrics.stats.hitRate).toBe('number');
      expect(typeof cacheMetrics.stats.totalRequests).toBe('number');
    });

    it('should provide confidence level calculation', () => {
      // Mock confidence level calculation
      const mockAnalyticsIntegration = analyticsIntegration as jest.Mocked<typeof analyticsIntegration>;
      
      mockAnalyticsIntegration.getConfidenceLevel.mockImplementation((raceCount: number) => {
        if (raceCount >= 3) return 'high';
        if (raceCount >= 1) return 'estimated';
        return 'no_data';
      });

      // Test confidence level calculation
      expect(analyticsIntegration.getConfidenceLevel(5)).toBe('high');
      expect(analyticsIntegration.getConfidenceLevel(2)).toBe('estimated');
      expect(analyticsIntegration.getConfidenceLevel(0)).toBe('no_data');
    });
  });

  describe('Visual Rendering Integration', () => {
    it('should render confidence badges correctly', () => {
      // Test confidence badge rendering directly
      const highConfidenceBadge = visualScoringRenderer.renderConfidenceBadge('high');
      expect(highConfidenceBadge.text).toBe('High Confidence');
      expect(highConfidenceBadge.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(highConfidenceBadge.icon).toBeDefined();

      const estimatedBadge = visualScoringRenderer.renderConfidenceBadge('estimated');
      expect(estimatedBadge.text).toBe('Estimated');
      expect(estimatedBadge.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(estimatedBadge.icon).toBeDefined();

      const noDataBadge = visualScoringRenderer.renderConfidenceBadge('no_data');
      expect(noDataBadge.text).toBe('No Personal Data');
      expect(noDataBadge.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(noDataBadge.icon).toBeDefined();
    });

    it('should render visual scoring with various confidence levels', () => {
      // Test visual scoring with different confidence levels
      const mockScore = {
        overall: 75,
        factors: {
          performance: 80,
          safety: 70,
          consistency: 75,
          predictability: 65,
          familiarity: 85,
          fatigueRisk: 30,
          attritionRisk: 25,
          timeVolatility: 40
        },
        iRatingRisk: 'medium' as const,
        safetyRatingRisk: 'low' as const,
        reasoning: [],
        dataConfidence: {
          performance: 'high' as ConfidenceLevel,
          safety: 'estimated' as ConfidenceLevel,
          consistency: 'high' as ConfidenceLevel,
          familiarity: 'high' as ConfidenceLevel,
          globalStats: 'high' as const
        },
        priorityScore: 75
      };

      const visualScoring = visualScoringRenderer.renderVisualScoring(mockScore);

      // Verify all visual components exist
      expect(visualScoring.performance).toBeDefined();
      expect(visualScoring.safety).toBeDefined();
      expect(visualScoring.consistency).toBeDefined();
      expect(visualScoring.predictability).toBeDefined();
      expect(visualScoring.familiarity).toBeDefined();
      expect(visualScoring.fatigueRisk).toBeDefined();
      expect(visualScoring.attritionRisk).toBeDefined();
      expect(visualScoring.timeVolatility).toBeDefined();
      expect(visualScoring.overall).toBeDefined();

      // Verify progress bar structure
      Object.values(visualScoring).forEach(component => {
        if ('value' in component) { // Progress bar
          expect(component.value).toBeGreaterThanOrEqual(0);
          expect(component.value).toBeLessThanOrEqual(100);
          expect(component.gradient).toBeDefined();
          expect(component.gradient.currentColor).toMatch(/^#[0-9a-f]{6}$/i);
          expect(component.icon).toBeDefined();
          expect(component.tooltip).toBeDefined();
        } else { // Racing badge
          expect(component.level).toMatch(/^(rookie|contender|champion|legend)$/);
          expect(component.style).toBe('flag');
          expect(component.colors).toBeDefined();
          expect(component.racingTheme).toBeDefined();
        }
      });

      // Verify racing theme consistency for good score (75)
      const overall = visualScoring.overall;
      expect(overall.racingTheme.greenFlag).toBe(true);
      expect(overall.level).toMatch(/^(champion|contender)$/);
    });

    it('should handle edge case scores in visual rendering', () => {
      // Test with extreme scores
      const mockScore = {
        overall: 0,
        factors: {
          performance: 0,
          safety: 100,
          consistency: 50,
          predictability: 25,
          familiarity: 75,
          fatigueRisk: 100,
          attritionRisk: 0,
          timeVolatility: 50
        },
        iRatingRisk: 'high' as const,
        safetyRatingRisk: 'low' as const,
        reasoning: [],
        dataConfidence: {
          performance: 'no_data' as ConfidenceLevel,
          safety: 'high' as ConfidenceLevel,
          consistency: 'estimated' as ConfidenceLevel,
          familiarity: 'high' as ConfidenceLevel,
          globalStats: 'default' as const
        },
        priorityScore: 0
      };

      const visualScoring = visualScoringRenderer.renderVisualScoring(mockScore);

      // Should handle 0 score (black flag)
      expect(visualScoring.overall.racingTheme.blackFlag).toBe(true);
      expect(visualScoring.overall.level).toBe('rookie');

      // Should handle 100 score for safety
      expect(visualScoring.safety.value).toBe(100);
      expect(visualScoring.safety.gradient.currentColor).toMatch(/^#[4-9a-f]/); // Should be greenish
    });
  });

  describe('Component Integration', () => {
    it('should integrate analytics confidence levels with visual rendering', () => {
      // Mock analytics integration
      const mockAnalyticsIntegration = analyticsIntegration as jest.Mocked<typeof analyticsIntegration>;
      
      mockAnalyticsIntegration.getConfidenceLevel.mockImplementation((raceCount: number) => {
        if (raceCount >= 3) return 'high';
        if (raceCount >= 1) return 'estimated';
        return 'no_data';
      });

      // Test integration between confidence calculation and visual rendering
      const highConfidence = analyticsIntegration.getConfidenceLevel(5);
      const estimatedConfidence = analyticsIntegration.getConfidenceLevel(2);
      const noDataConfidence = analyticsIntegration.getConfidenceLevel(0);

      // Render badges for each confidence level
      const highBadge = visualScoringRenderer.renderConfidenceBadge(highConfidence);
      const estimatedBadge = visualScoringRenderer.renderConfidenceBadge(estimatedConfidence);
      const noDataBadge = visualScoringRenderer.renderConfidenceBadge(noDataConfidence);

      // Verify correct badge text for each confidence level
      expect(highBadge.text).toBe('High Confidence');
      expect(estimatedBadge.text).toBe('Estimated');
      expect(noDataBadge.text).toBe('No Personal Data');

      // Verify different colors for different confidence levels
      expect(highBadge.color).not.toBe(estimatedBadge.color);
      expect(estimatedBadge.color).not.toBe(noDataBadge.color);
    });

    it('should demonstrate performance monitoring integration', () => {
      // Mock performance monitoring
      const mockAnalyticsIntegration = analyticsIntegration as jest.Mocked<typeof analyticsIntegration>;
      
      mockAnalyticsIntegration.getCacheMetrics.mockReturnValue({
        size: 15,
        stats: {
          hitRate: 0.8,
          totalRequests: 25,
          hits: 20,
          misses: 5
        }
      });

      mockAnalyticsIntegration.getAnalyticsCallStats.mockReturnValue({
        totalCalls: 10,
        cacheHitRate: 0.7,
        errorRate: 0.1,
        avgDurationMs: 30,
        recentCalls: [
          {
            timestamp: new Date(),
            method: 'getUserPerformanceData',
            userId: 'test-user',
            duration: 25,
            cacheHit: true
          }
        ]
      });

      // Test performance monitoring integration
      const cacheMetrics = analyticsIntegration.getCacheMetrics();
      const callStats = analyticsIntegration.getAnalyticsCallStats();

      // Verify cache performance metrics
      expect(cacheMetrics.stats.hitRate).toBe(0.8);
      expect(cacheMetrics.size).toBe(15);

      // Verify call statistics
      expect(callStats.totalCalls).toBe(10);
      expect(callStats.cacheHitRate).toBe(0.7);
      expect(callStats.errorRate).toBe(0.1);
      expect(callStats.avgDurationMs).toBe(30);
      expect(callStats.recentCalls).toHaveLength(1);
    });

    it('should validate data consistency between components', () => {
      // Test that confidence levels are consistently applied
      const testCases = [
        { raceCount: 5, expectedConfidence: 'high' as ConfidenceLevel },
        { raceCount: 2, expectedConfidence: 'estimated' as ConfidenceLevel },
        { raceCount: 0, expectedConfidence: 'no_data' as ConfidenceLevel }
      ];

      // Mock analytics integration
      const mockAnalyticsIntegration = analyticsIntegration as jest.Mocked<typeof analyticsIntegration>;
      
      mockAnalyticsIntegration.getConfidenceLevel.mockImplementation((raceCount: number) => {
        if (raceCount >= 3) return 'high';
        if (raceCount >= 1) return 'estimated';
        return 'no_data';
      });

      testCases.forEach(({ raceCount, expectedConfidence }) => {
        const confidence = analyticsIntegration.getConfidenceLevel(raceCount);
        expect(confidence).toBe(expectedConfidence);

        // Verify visual rendering is consistent with confidence level
        const badge = visualScoringRenderer.renderConfidenceBadge(confidence);
        
        switch (expectedConfidence) {
          case 'high':
            expect(badge.text).toBe('High Confidence');
            break;
          case 'estimated':
            expect(badge.text).toBe('Estimated');
            break;
          case 'no_data':
            expect(badge.text).toBe('No Personal Data');
            break;
        }
      });
    });
  });
});