import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RecommendationDetail } from '../RecommendationDetail';
import { ScoredOpportunity } from '@/lib/recommendations/types';
import fc from 'fast-check';

/**
 * Property 3: Modal Click-Outside Behavior
 * **Validates: Requirements 2.2**
 * 
 * For any open Recommendation_Modal, when a click event occurs outside the modal boundaries, 
 * the modal should close and return to the closed state
 */

const mockRecommendation: ScoredOpportunity = {
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
  }
};

describe('Modal Click-Outside Behavior Property Tests', () => {
  it('Property 3: Modal Click-Outside Behavior - **Validates: Requirements 2.2**', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate random coordinates for click events outside modal
          clickX: fc.integer({ min: 0, max: 1000 }),
          clickY: fc.integer({ min: 0, max: 1000 }),
          // Generate unique strings with prefixes and random suffixes to avoid conflicts
          seriesName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}_${Math.random().toString(36).substr(2, 9)}`),
          trackName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}_${Math.random().toString(36).substr(2, 9)}`),
          score: fc.integer({ min: 0, max: 100 })
        }),
        ({ clickX, clickY, seriesName, trackName, score }) => {
          try {
            const testRecommendation = {
              ...mockRecommendation,
              seriesName,
              trackName,
              score: {
                ...mockRecommendation.score,
                overall: score
              }
            };

            const mockOnClose = jest.fn();

            // Render the modal (which should be open)
            const { container } = render(
              <RecommendationDetail
                recommendation={testRecommendation}
                onClose={mockOnClose}
              />
            );

            // Verify modal is rendered (open state)
            const modal = screen.getByText(seriesName);
            expect(modal).toBeInTheDocument();

            // Find the backdrop (the overlay behind the modal)
            // The component uses bg-black/50 (Tailwind's opacity syntax)
            const backdrop = container.querySelector('.fixed.inset-0');
            expect(backdrop).toBeInTheDocument();

            // Simulate click outside modal (on the backdrop)
            if (backdrop) {
              fireEvent.mouseDown(backdrop);
            }

            // Property: Modal should close when clicked outside
            // The onClose callback should be called
            expect(mockOnClose).toHaveBeenCalled();
          } finally {
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3 Edge Case: Modal should NOT close when clicking inside modal content', () => {
    fc.assert(
      fc.property(
        fc.record({
          seriesName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}_${Math.random().toString(36).substr(2, 9)}`),
          trackName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}_${Math.random().toString(36).substr(2, 9)}`),
          score: fc.integer({ min: 0, max: 100 })
        }),
        ({ seriesName, trackName, score }) => {
          const testRecommendation = {
            ...mockRecommendation,
            seriesName,
            trackName,
            score: {
              ...mockRecommendation.score,
              overall: score
            }
          };

          const mockOnClose = jest.fn();
          
          // Render the modal
          const { container } = render(
            <RecommendationDetail 
              recommendation={testRecommendation} 
              onClose={mockOnClose} 
            />
          );

          // Find the modal content (the card inside the backdrop)
          const modalContent = container.querySelector('.max-w-4xl.max-h-\\[90vh\\]');
          expect(modalContent).toBeInTheDocument();

          // Simulate click inside modal content
          if (modalContent) {
            fireEvent.mouseDown(modalContent);
          }

          // Property: Modal should NOT close when clicking inside
          // The onClose callback should NOT be called
          expect(mockOnClose).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3 Escape Key Behavior: Modal should close when Escape key is pressed', () => {
    fc.assert(
      fc.property(
        fc.record({
          seriesName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Series_${s.replace(/[^a-zA-Z0-9]/g, 'X')}_${Math.random().toString(36).substr(2, 9)}`),
          trackName: fc.string({ minLength: 5, maxLength: 20 }).map((s, index) => `Track_${s.replace(/[^a-zA-Z0-9]/g, 'Y')}_${Math.random().toString(36).substr(2, 9)}`),
          score: fc.integer({ min: 0, max: 100 })
        }),
        ({ seriesName, trackName, score }) => {
          const testRecommendation = {
            ...mockRecommendation,
            seriesName,
            trackName,
            score: {
              ...mockRecommendation.score,
              overall: score
            }
          };

          const mockOnClose = jest.fn();
          
          // Render the modal
          render(
            <RecommendationDetail 
              recommendation={testRecommendation} 
              onClose={mockOnClose} 
            />
          );

          // Simulate Escape key press
          fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

          // Property: Modal should close when Escape is pressed
          // The onClose callback should be called
          expect(mockOnClose).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});