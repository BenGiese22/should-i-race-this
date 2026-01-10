import { VisualScoringRenderer } from '../visual-scoring';
import { Score, ScoringFactors, DataConfidence } from '../types';

describe('VisualScoringRenderer', () => {
  let renderer: VisualScoringRenderer;

  beforeEach(() => {
    renderer = new VisualScoringRenderer();
  });

  describe('calculateGradientColor', () => {
    it('should return red color for low scores (0-33)', () => {
      const gradient = renderer.calculateGradientColor(20);
      expect(gradient.currentColor).toMatch(/^#ff/); // Should start with red
      expect(gradient.startColor).toBe('#ff4444');
      expect(gradient.endColor).toBe('#44ff44');
    });

    it('should return orange color for medium scores (34-66)', () => {
      const gradient = renderer.calculateGradientColor(50);
      expect(gradient.currentColor).toMatch(/^#ff/); // Should be orange-ish
      expect(gradient.cssGradient).toContain('linear-gradient');
    });

    it('should return green color for high scores (67-100)', () => {
      const gradient = renderer.calculateGradientColor(80);
      expect(gradient.currentColor).toMatch(/^#[4-9a-f]/); // Should be greenish
    });

    it('should clamp scores outside 0-100 range', () => {
      const lowGradient = renderer.calculateGradientColor(-10);
      const highGradient = renderer.calculateGradientColor(150);
      
      expect(lowGradient.currentColor).toBe(renderer.calculateGradientColor(0).currentColor);
      expect(highGradient.currentColor).toBe(renderer.calculateGradientColor(100).currentColor);
    });
  });

  describe('renderProgressBar', () => {
    it('should render progress bar with correct properties', () => {
      const progressBar = renderer.renderProgressBar(75, 'performance');
      
      expect(progressBar.value).toBe(75);
      expect(progressBar.icon).toBe('🏎️');
      expect(progressBar.tooltip).toContain('Performance Score: 75/100');
      expect(progressBar.gradient).toBeDefined();
    });

    it('should round score values', () => {
      const progressBar = renderer.renderProgressBar(75.7, 'safety');
      expect(progressBar.value).toBe(76);
    });
  });

  describe('renderOverallBadge', () => {
    it('should render checkered flag for excellent scores (90-100)', () => {
      const badge = renderer.renderOverallBadge(95, 'high');
      
      expect(badge.level).toBe('legend');
      expect(badge.racingTheme.checkeredFlag).toBe(true);
      expect(badge.description).toContain('checkered flag');
      expect(badge.icon).toBe('🏁');
    });

    it('should render green flag for good scores (75-89)', () => {
      const badge = renderer.renderOverallBadge(80, 'high');
      
      expect(badge.level).toBe('champion');
      expect(badge.racingTheme.greenFlag).toBe(true);
      expect(badge.description).toContain('green flag');
      expect(badge.colors.primary).toBe('#22c55e');
    });

    it('should render yellow flag for moderate scores (50-74)', () => {
      const badge = renderer.renderOverallBadge(60, 'estimated');
      
      expect(badge.level).toBe('contender');
      expect(badge.racingTheme.yellowFlag).toBe(true);
      expect(badge.description).toContain('yellow flag');
    });

    it('should render black flag for low scores (0-49)', () => {
      const badge = renderer.renderOverallBadge(30, 'no_data');
      
      expect(badge.level).toBe('rookie');
      expect(badge.racingTheme.blackFlag).toBe(true);
      expect(badge.description).toContain('black flag');
    });
  });

  describe('renderConfidenceBadge', () => {
    it('should render high confidence badge', () => {
      const badge = renderer.renderConfidenceBadge('high');
      
      expect(badge.text).toBe('High Confidence');
      expect(badge.color).toBe('#22c55e');
      expect(badge.icon).toBe('🏁');
      expect(badge.description).toContain('actual race data');
    });

    it('should render estimated confidence badge', () => {
      const badge = renderer.renderConfidenceBadge('estimated');
      
      expect(badge.text).toBe('Estimated');
      expect(badge.color).toBe('#eab308');
      expect(badge.description).toContain('similar series');
    });

    it('should render no data confidence badge', () => {
      const badge = renderer.renderConfidenceBadge('no_data');
      
      expect(badge.text).toBe('No Personal Data');
      expect(badge.color).toBe('#6b7280');
      expect(badge.description).toContain('general statistics');
    });
  });

  describe('renderVisualScoring', () => {
    it('should render complete visual scoring from score object', () => {
      const mockScore: Score = {
        overall: 85,
        factors: {
          performance: 80,
          safety: 90,
          consistency: 75,
          predictability: 85,
          familiarity: 70,
          fatigueRisk: 60,
          attritionRisk: 80,
          timeVolatility: 75
        },
        iRatingRisk: 'medium',
        safetyRatingRisk: 'low',
        reasoning: ['Test reasoning'],
        dataConfidence: {
          performance: 'high',
          safety: 'high',
          consistency: 'estimated',
          familiarity: 'high',
          globalStats: 'high'
        },
        priorityScore: 85
      };

      const visualScoring = renderer.renderVisualScoring(mockScore);

      expect(visualScoring.performance.value).toBe(80);
      expect(visualScoring.safety.value).toBe(90);
      expect(visualScoring.overall.level).toBe('champion'); // 85 score
      expect(visualScoring.overall.racingTheme.greenFlag).toBe(true);
      
      // Check all factors are present
      expect(visualScoring.performance).toBeDefined();
      expect(visualScoring.safety).toBeDefined();
      expect(visualScoring.consistency).toBeDefined();
      expect(visualScoring.predictability).toBeDefined();
      expect(visualScoring.familiarity).toBeDefined();
      expect(visualScoring.fatigueRisk).toBeDefined();
      expect(visualScoring.attritionRisk).toBeDefined();
      expect(visualScoring.timeVolatility).toBeDefined();
    });
  });
});