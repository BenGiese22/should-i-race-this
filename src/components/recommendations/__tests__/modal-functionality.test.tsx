import { render, screen, fireEvent } from '@testing-library/react';
import { RecommendationDetail } from '../RecommendationDetail';
import { ScoredOpportunity } from '@/lib/recommendations/types';

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

describe('Modal Functionality Tests', () => {
  it('should close modal when clicking outside', () => {
    const mockOnClose = jest.fn();
    
    const { container } = render(
      <RecommendationDetail 
        recommendation={mockRecommendation} 
        onClose={mockOnClose} 
      />
    );

    // Find the backdrop (the overlay behind the modal)
    const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(backdrop).toBeInTheDocument();

    // Simulate click on backdrop
    if (backdrop) {
      fireEvent.mouseDown(backdrop);
    }

    // Modal should close
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should NOT close modal when clicking inside modal content', () => {
    const mockOnClose = jest.fn();
    
    const { container } = render(
      <RecommendationDetail 
        recommendation={mockRecommendation} 
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

    // Modal should NOT close
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should close modal when Escape key is pressed', () => {
    const mockOnClose = jest.fn();
    
    render(
      <RecommendationDetail 
        recommendation={mockRecommendation} 
        onClose={mockOnClose} 
      />
    );

    // Simulate Escape key press
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Modal should close
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when close button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(
      <RecommendationDetail 
        recommendation={mockRecommendation} 
        onClose={mockOnClose} 
      />
    );

    // Find and click the close button
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    // Modal should close
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should render modal content correctly', () => {
    const mockOnClose = jest.fn();
    
    render(
      <RecommendationDetail 
        recommendation={mockRecommendation} 
        onClose={mockOnClose} 
      />
    );

    // Verify modal content is rendered
    expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
    expect(screen.getByText('Road Atlanta')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});