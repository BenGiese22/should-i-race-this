import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RecommendationCard } from '../RecommendationCard';
import { ScoredRecommendation, RecommendationMode } from '@/lib/recommendations/types';
import { LicenseLevel } from '@/lib/types/license';
import fc from 'fast-check';

/**
 * Property 4: Card Interaction
 * **Validates: Requirements 2.1**
 *
 * For any RecommendationCard, the expand/collapse interaction should work correctly
 * and display detailed information when expanded.
 */

const createMockRecommendation = (overrides: Partial<ScoredRecommendation> = {}): ScoredRecommendation => ({
  seriesId: 1,
  seriesName: 'Skip Barber Formula 2000',
  trackId: 101,
  trackName: 'Road Atlanta',
  licenseRequired: LicenseLevel.D,
  category: 'sports_car',
  seasonYear: 2024,
  seasonQuarter: 1,
  raceWeekNum: 5,
  raceLength: 45,
  hasOpenSetup: false,
  timeSlots: [
    { hour: 14, dayOfWeek: 1, strengthOfField: 1500, participantCount: 20 }
  ],
  globalStats: {
    avgIncidentsPerRace: 2.1,
    avgFinishPositionStdDev: 4.5,
    avgStrengthOfField: 1500,
    strengthOfFieldVariability: 200,
    attritionRate: 0.15,
    avgRaceLength: 45
  },
  score: {
    overall: 85,
    priorityScore: 80,
    factors: {
      performance: 78,
      safety: 92,
      consistency: 65,
      predictability: 88,
      familiarity: 45,
      fatigueRisk: 75,
      attritionRisk: 85,
      timeVolatility: 70
    },
    iRatingRisk: 'low',
    safetyRatingRisk: 'medium',
    reasoning: [
      'Strong performance history at this track',
      'Low incident rate expected',
      'Consistent field strength'
    ],
    dataConfidence: {
      performance: 'high',
      safety: 'high',
      consistency: 'moderate',
      familiarity: 'high',
      globalStats: 'high'
    }
  },
  visualIndicators: {
    performance: { value: 78, gradient: { startColor: '#EF4444', midColor: '#F59E0B', endColor: '#10B981', currentColor: '#84CC16', cssGradient: '' }, icon: '📈', tooltip: '' },
    safety: { value: 92, gradient: { startColor: '#EF4444', midColor: '#F59E0B', endColor: '#10B981', currentColor: '#10B981', cssGradient: '' }, icon: '🛡️', tooltip: '' },
    consistency: { value: 65, gradient: { startColor: '#EF4444', midColor: '#F59E0B', endColor: '#10B981', currentColor: '#84CC16', cssGradient: '' }, icon: '📊', tooltip: '' },
    predictability: { value: 88, gradient: { startColor: '#EF4444', midColor: '#F59E0B', endColor: '#10B981', currentColor: '#10B981', cssGradient: '' }, icon: '🎲', tooltip: '' },
    familiarity: { value: 45, gradient: { startColor: '#EF4444', midColor: '#F59E0B', endColor: '#10B981', currentColor: '#F59E0B', cssGradient: '' }, icon: '🎯', tooltip: '' },
    fatigueRisk: { value: 75, gradient: { startColor: '#EF4444', midColor: '#F59E0B', endColor: '#10B981', currentColor: '#84CC16', cssGradient: '' }, icon: '⏱️', tooltip: '' },
    attritionRisk: { value: 85, gradient: { startColor: '#EF4444', midColor: '#F59E0B', endColor: '#10B981', currentColor: '#10B981', cssGradient: '' }, icon: '⚠️', tooltip: '' },
    timeVolatility: { value: 70, gradient: { startColor: '#EF4444', midColor: '#F59E0B', endColor: '#10B981', currentColor: '#84CC16', cssGradient: '' }, icon: '📅', tooltip: '' },
    overall: {
      level: 'champion',
      style: 'flag',
      colors: { primary: '#10B981', accent: '#059669', text: '#FFFFFF' },
      icon: '🏆',
      description: 'Champion level recommendation',
      racingTheme: { checkeredFlag: true }
    }
  },
  ...overrides
});

describe('Card Interaction Property Tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('Property 4: Card renders with correct content for any valid recommendation data', () => {
    fc.assert(
      fc.property(
        fc.record({
          seriesName: fc.string({ minLength: 5, maxLength: 30 }).map(s => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}`),
          trackName: fc.string({ minLength: 5, maxLength: 30 }).map(s => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}`),
          score: fc.integer({ min: 0, max: 100 }),
          rank: fc.integer({ min: 1, max: 10 })
        }),
        ({ seriesName, trackName, score, rank }) => {
          try {
            const testRecommendation = createMockRecommendation({
              seriesName,
              trackName,
              score: {
                ...createMockRecommendation().score,
                overall: score
              }
            });

            render(
              <RecommendationCard
                recommendation={testRecommendation}
                rank={rank}
                mode="balanced"
              />
            );

            // Verify card is rendered with correct content
            expect(screen.getByText(seriesName)).toBeInTheDocument();
            // Track name is prefixed with @
            expect(screen.getByText(`@ ${trackName}`)).toBeInTheDocument();
            // Rank is displayed
            expect(screen.getByText(`#${rank}`)).toBeInTheDocument();
          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 4a: Card expand/collapse works correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          seriesName: fc.string({ minLength: 5, maxLength: 20 }).map(s => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}`),
          trackName: fc.string({ minLength: 5, maxLength: 20 }).map(s => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}`)
        }),
        ({ seriesName, trackName }) => {
          try {
            const testRecommendation = createMockRecommendation({
              seriesName,
              trackName
            });

            render(
              <RecommendationCard
                recommendation={testRecommendation}
                rank={1}
                mode="balanced"
              />
            );

            // Initially collapsed - "More Details" button visible
            expect(screen.getByText('More Details')).toBeInTheDocument();
            expect(screen.queryByText('Scoring Breakdown')).not.toBeInTheDocument();

            // Click to expand
            fireEvent.click(screen.getByText('More Details'));

            // After expanding - "Less Details" button visible and content shown
            expect(screen.getByText('Less Details')).toBeInTheDocument();
            expect(screen.getByText('Scoring Breakdown')).toBeInTheDocument();

            // Click to collapse
            fireEvent.click(screen.getByText('Less Details'));

            // After collapsing - back to initial state
            expect(screen.getByText('More Details')).toBeInTheDocument();
            expect(screen.queryByText('Scoring Breakdown')).not.toBeInTheDocument();
          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 4b: Card hover effects are present', () => {
    fc.assert(
      fc.property(
        fc.record({
          seriesName: fc.string({ minLength: 5, maxLength: 20 }).map(s => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}`),
          trackName: fc.string({ minLength: 5, maxLength: 20 }).map(s => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}`)
        }),
        ({ seriesName, trackName }) => {
          try {
            const testRecommendation = createMockRecommendation({
              seriesName,
              trackName
            });

            const { container } = render(
              <RecommendationCard
                recommendation={testRecommendation}
                rank={1}
                mode="balanced"
              />
            );

            // Find the main card container - should have hover styling
            const cardElement = container.querySelector('.hover\\:shadow-md');
            expect(cardElement).toBeInTheDocument();
            expect(cardElement).toHaveClass('transition-shadow');
          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Property 4c: Multiple cards render independently', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            seriesId: fc.integer({ min: 1, max: 1000 }),
            seriesName: fc.string({ minLength: 5, maxLength: 20 }).map(s => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}_${Math.random().toString(36).substr(2, 5)}`),
            trackId: fc.integer({ min: 1, max: 1000 }),
            trackName: fc.string({ minLength: 5, maxLength: 20 }).map(s => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}_${Math.random().toString(36).substr(2, 5)}`)
          }),
          { minLength: 2, maxLength: 4 }
        ),
        (recommendationData) => {
          try {
            const recommendations = recommendationData.map((data, index) =>
              createMockRecommendation({
                seriesId: data.seriesId + index,
                seriesName: data.seriesName,
                trackId: data.trackId + index,
                trackName: data.trackName
              })
            );

            render(
              <div>
                {recommendations.map((rec, index) => (
                  <RecommendationCard
                    key={`${rec.seriesId}-${rec.trackId}`}
                    recommendation={rec}
                    rank={index + 1}
                    mode="balanced"
                  />
                ))}
              </div>
            );

            // Each card should render with its series name
            recommendations.forEach((rec, index) => {
              expect(screen.getByText(rec.seriesName)).toBeInTheDocument();
              expect(screen.getByText(`#${index + 1}`)).toBeInTheDocument();
            });
          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
