import { render, screen, fireEvent } from '@testing-library/react';
import { RecommendationCard } from '../RecommendationCard';
import { ScoredOpportunity } from '@/lib/recommendations/types';
import fc from 'fast-check';

/**
 * Property 4: Modal Card Interaction
 * **Validates: Requirements 2.1**
 * 
 * For any Recommendation_Card click event, the system should open the corresponding 
 * Recommendation_Modal and display the detailed information
 */

const createMockRecommendation = (overrides: Partial<ScoredOpportunity> = {}): ScoredOpportunity => ({
  seriesId: 1,
  seriesName: 'Skip Barber Formula 2000',
  trackId: 101,
  trackName: 'Road Atlanta',
  licenseRequired: 'D',
  category: 'road',
  seasonYear: 2024,
  seasonQuarter: 1,
  raceWeekNum: 5,
  raceLength: 45,
  hasOpenSetup: false,
  timeSlots: [],
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
    ]
  },
  ...overrides
});

describe('Modal Card Interaction Property Tests', () => {
  it('Property 4: Modal Card Interaction - **Validates: Requirements 2.1**', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate random recommendation data with unique prefixes and random suffixes
          seriesId: fc.integer({ min: 1, max: 1000 }),
          seriesName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}_${Math.random().toString(36).substr(2, 9)}`),
          trackId: fc.integer({ min: 1, max: 1000 }),
          trackName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}_${Math.random().toString(36).substr(2, 9)}`),
          licenseRequired: fc.constantFrom('R', 'D', 'C', 'B', 'A'),
          category: fc.constantFrom('oval', 'road', 'dirt_oval', 'dirt_road'),
          raceLength: fc.integer({ min: 15, max: 180 }),
          hasOpenSetup: fc.boolean(),
          score: fc.integer({ min: 0, max: 100 })
        }),
        ({ seriesId, seriesName, trackId, trackName, licenseRequired, category, raceLength, hasOpenSetup, score }) => {
          const testRecommendation = createMockRecommendation({
            seriesId,
            seriesName,
            trackId,
            trackName,
            licenseRequired: licenseRequired as any,
            category: category as any,
            raceLength,
            hasOpenSetup,
            score: {
              ...createMockRecommendation().score,
              overall: score
            }
          });

          const mockOnSelect = jest.fn();
          
          // Render the recommendation card
          render(
            <RecommendationCard 
              recommendation={testRecommendation} 
              onSelect={mockOnSelect} 
            />
          );

          // Verify card is rendered with correct content
          expect(screen.getByText(seriesName)).toBeInTheDocument();
          expect(screen.getByText(trackName)).toBeInTheDocument();

          // Find the clickable card element
          const cardElement = screen.getByText(seriesName).closest('.cursor-pointer');
          expect(cardElement).toBeInTheDocument();

          // Simulate click on the card
          if (cardElement) {
            fireEvent.click(cardElement);
          }

          // Property: Card click should trigger onSelect with the recommendation
          expect(mockOnSelect).toHaveBeenCalledWith(testRecommendation);
          expect(mockOnSelect).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4 Multiple Cards: Each card should trigger onSelect with its specific recommendation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            seriesId: fc.integer({ min: 1, max: 1000 }),
            seriesName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}_${Math.random().toString(36).substr(2, 9)}`),
            trackId: fc.integer({ min: 1, max: 1000 }),
            trackName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}_${Math.random().toString(36).substr(2, 9)}`),
            score: fc.integer({ min: 0, max: 100 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (recommendationData) => {
          const mockOnSelect = jest.fn();
          const recommendations = recommendationData.map((data, index) => 
            createMockRecommendation({
              seriesId: data.seriesId + index, // Ensure unique IDs
              seriesName: `${data.seriesName}_${index}`, // Ensure unique names
              trackId: data.trackId + index,
              trackName: `${data.trackName}_${index}`,
              score: {
                ...createMockRecommendation().score,
                overall: data.score
              }
            })
          );

          // Render multiple cards
          const { container } = render(
            <div>
              {recommendations.map((rec, index) => (
                <RecommendationCard 
                  key={`${rec.seriesId}-${rec.trackId}-${index}`}
                  recommendation={rec} 
                  onSelect={mockOnSelect} 
                />
              ))}
            </div>
          );

          // Click on each card and verify correct recommendation is passed
          recommendations.forEach((expectedRecommendation, index) => {
            const cardElement = screen.getByText(`${expectedRecommendation.seriesName}`).closest('.cursor-pointer');
            expect(cardElement).toBeInTheDocument();
            
            if (cardElement) {
              fireEvent.click(cardElement);
            }

            // Property: Each card should call onSelect with its specific recommendation
            expect(mockOnSelect).toHaveBeenCalledWith(expectedRecommendation);
          });

          // Verify onSelect was called once for each card
          expect(mockOnSelect).toHaveBeenCalledTimes(recommendations.length);
        }
      ),
      { numRuns: 50 } // Reduced runs due to complexity of multiple cards
    );
  });

  it('Property 4 Card Hover State: Card should have hover effects when interactive', () => {
    fc.assert(
      fc.property(
        fc.record({
          seriesName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}_${Math.random().toString(36).substr(2, 9)}`),
          trackName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}_${Math.random().toString(36).substr(2, 9)}`),
          score: fc.integer({ min: 0, max: 100 })
        }),
        ({ seriesName, trackName, score }) => {
          const testRecommendation = createMockRecommendation({
            seriesName,
            trackName,
            score: {
              ...createMockRecommendation().score,
              overall: score
            }
          });

          const mockOnSelect = jest.fn();
          
          // Render the recommendation card
          render(
            <RecommendationCard 
              recommendation={testRecommendation} 
              onSelect={mockOnSelect} 
            />
          );

          // Find the card element
          const cardElement = screen.getByText(seriesName).closest('.cursor-pointer');
          expect(cardElement).toBeInTheDocument();

          // Property: Card should have hover styling classes
          expect(cardElement).toHaveClass('hover:shadow-lg');
          expect(cardElement).toHaveClass('transition-shadow');
          expect(cardElement).toHaveClass('cursor-pointer');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4 No Handler: Card should not crash when onSelect is undefined', () => {
    fc.assert(
      fc.property(
        fc.record({
          seriesName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}_${Math.random().toString(36).substr(2, 9)}`),
          trackName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}_${Math.random().toString(36).substr(2, 9)}`),
          score: fc.integer({ min: 0, max: 100 })
        }),
        ({ seriesName, trackName, score }) => {
          const testRecommendation = createMockRecommendation({
            seriesName,
            trackName,
            score: {
              ...createMockRecommendation().score,
              overall: score
            }
          });

          // Render card without onSelect handler
          render(
            <RecommendationCard 
              recommendation={testRecommendation} 
              // onSelect is undefined
            />
          );

          // Verify card renders without crashing
          expect(screen.getByText(seriesName)).toBeInTheDocument();
          expect(screen.getByText(trackName)).toBeInTheDocument();

          // Find the card element
          const cardElement = screen.getByText(seriesName).closest('.cursor-pointer');
          expect(cardElement).toBeInTheDocument();

          // Property: Clicking should not crash when onSelect is undefined
          expect(() => {
            if (cardElement) {
              fireEvent.click(cardElement);
            }
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});