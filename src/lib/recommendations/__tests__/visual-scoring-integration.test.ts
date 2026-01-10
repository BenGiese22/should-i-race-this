import { VisualScoringRenderer } from '../visual-scoring';
import { ScoringAlgorithm } from '../scoring';
import { 
  RacingOpportunity, 
  UserHistory, 
  LicenseLevel, 
  Category,
  SeriesTrackHistory,
  UserOverallStats,
  LicenseClass,
  GlobalStats,
  TimeSlot,
  ConfidenceLevel
} from '../types';

describe('Visual Scoring Integration', () => {
  let renderer: VisualScoringRenderer;
  let scoringAlgorithm: ScoringAlgorithm;

  beforeEach(() => {
    renderer = new VisualScoringRenderer();
    scoringAlgorithm = new ScoringAlgorithm();
  });

  it('should render visual scoring for a complete recommendation flow', () => {
    // Create mock racing opportunity
    const opportunity: RacingOpportunity = {
      seriesId: 1,
      seriesName: 'Porsche Cup',
      trackId: 101,
      trackName: 'Road America',
      licenseRequired: 'D' as LicenseLevel,
      category: 'road' as Category,
      seasonYear: 2024,
      seasonQuarter: 1,
      raceWeekNum: 1,
      raceLength: 45,
      hasOpenSetup: false,
      timeSlots: [] as TimeSlot[],
      globalStats: {
        avgIncidentsPerRace: 2.5,
        avgFinishPositionStdDev: 5.2,
        avgStrengthOfField: 1500,
        strengthOfFieldVariability: 200,
        attritionRate: 15,
        avgRaceLength: 45
      } as GlobalStats
    };

    // Create mock user history
    const userHistory: UserHistory = {
      userId: 'test-user',
      seriesTrackHistory: [
        {
          seriesId: 1,
          trackId: 101,
          raceCount: 5,
          avgStartingPosition: 12,
          avgFinishingPosition: 8,
          avgPositionDelta: 4,
          avgIncidents: 1.2,
          finishPositionStdDev: 3.1,
          lastRaceDate: new Date()
        }
      ] as SeriesTrackHistory[],
      overallStats: {
        totalRaces: 50,
        avgIncidentsPerRace: 1.8,
        avgPositionDelta: 2.5,
        overallConsistency: 4.2
      } as UserOverallStats,
      licenseClasses: [
        {
          category: 'road' as Category,
          level: 'C' as LicenseLevel,
          safetyRating: 3.2,
          iRating: 1800
        }
      ] as LicenseClass[]
    };

    // Calculate score using scoring algorithm
    const score = scoringAlgorithm.calculateScore(opportunity, userHistory, 'balanced');

    // Render visual scoring
    const visualScoring = renderer.renderVisualScoring(score);

    // Verify visual scoring structure
    expect(visualScoring).toBeDefined();
    expect(visualScoring.performance).toBeDefined();
    expect(visualScoring.safety).toBeDefined();
    expect(visualScoring.consistency).toBeDefined();
    expect(visualScoring.predictability).toBeDefined();
    expect(visualScoring.familiarity).toBeDefined();
    expect(visualScoring.fatigueRisk).toBeDefined();
    expect(visualScoring.attritionRisk).toBeDefined();
    expect(visualScoring.timeVolatility).toBeDefined();
    expect(visualScoring.overall).toBeDefined();

    // Verify progress bars have correct structure
    expect(visualScoring.performance.value).toBeGreaterThanOrEqual(0);
    expect(visualScoring.performance.value).toBeLessThanOrEqual(100);
    expect(visualScoring.performance.gradient).toBeDefined();
    expect(visualScoring.performance.icon).toBe('🏎️');
    expect(visualScoring.performance.tooltip).toContain('Performance Score');

    // Verify overall badge has racing theme
    expect(visualScoring.overall.level).toMatch(/^(rookie|contender|champion|legend)$/);
    expect(visualScoring.overall.style).toBe('flag');
    expect(visualScoring.overall.racingTheme).toBeDefined();
    expect(visualScoring.overall.colors).toBeDefined();
    expect(['🏁', '🟢', '🟡', '⚫']).toContain(visualScoring.overall.icon);

    // Verify confidence badges work
    const confidenceBadge = renderer.renderConfidenceBadge(score.dataConfidence.performance);
    expect(confidenceBadge.text).toMatch(/^(High Confidence|Estimated|No Personal Data)$/);
    expect(confidenceBadge.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should handle edge case scores correctly', () => {
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

    const visualScoring = renderer.renderVisualScoring(mockScore);

    // Should handle 0 score (black flag)
    expect(visualScoring.overall.racingTheme.blackFlag).toBe(true);
    expect(visualScoring.overall.level).toBe('rookie');

    // Should handle 100 score for safety
    expect(visualScoring.safety.value).toBe(100);
    expect(visualScoring.safety.gradient.currentColor).toMatch(/^#[4-9a-f]/); // Should be greenish
  });
});