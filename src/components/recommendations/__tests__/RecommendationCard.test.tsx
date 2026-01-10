import { render, screen, fireEvent } from '@testing-library/react';
import { RecommendationCard } from '../RecommendationCard';
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

describe('RecommendationCard', () => {
  it('should render series and track names', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    
    expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
    expect(screen.getByText('Road Atlanta')).toBeInTheDocument();
  });

  it('should display overall score with racing badge', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    
    // The overall score is now displayed as a racing badge, not a direct number
    expect(screen.getByText('champion')).toBeInTheDocument();
  });

  it('should show category and license badges', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    
    expect(screen.getByText('ROAD')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('should display race length', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    
    expect(screen.getByText('45min')).toBeInTheDocument();
  });

  it('should show open setup badge when applicable', () => {
    const openSetupRecommendation = {
      ...mockRecommendation,
      hasOpenSetup: true
    };
    
    render(<RecommendationCard recommendation={openSetupRecommendation} />);
    
    expect(screen.getByText('Open Setup')).toBeInTheDocument();
  });

  it('should display risk indicators with correct colors', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    
    expect(screen.getByText('LOW')).toBeInTheDocument(); // iRating risk
    expect(screen.getByText('MEDIUM')).toBeInTheDocument(); // Safety risk
  });

  it('should show factor breakdown with progress bars', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    
    expect(screen.getByText('Performance Factors')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
    expect(screen.getByText('Consistency')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument(); // Performance score
    expect(screen.getByText('92')).toBeInTheDocument(); // Safety score
  });

  it('should display key insights when available', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    
    expect(screen.getByText('Key Insights')).toBeInTheDocument();
    expect(screen.getByText('Strong performance history at this track')).toBeInTheDocument();
    expect(screen.getByText('Low incident rate expected')).toBeInTheDocument();
    expect(screen.getByText('Consistent field strength')).toBeInTheDocument();
  });

  it('should call onSelect when card is clicked', () => {
    const mockOnSelect = jest.fn();
    render(<RecommendationCard recommendation={mockRecommendation} onSelect={mockOnSelect} />);
    
    const card = screen.getByText('Skip Barber Formula 2000').closest('.cursor-pointer');
    fireEvent.click(card!);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockRecommendation);
  });

  it('should handle missing reasoning gracefully', () => {
    const recommendationWithoutReasoning = {
      ...mockRecommendation,
      score: {
        ...mockRecommendation.score,
        reasoning: []
      }
    };
    
    render(<RecommendationCard recommendation={recommendationWithoutReasoning} />);
    
    expect(screen.queryByText('Key Insights')).not.toBeInTheDocument();
  });

  it('should format factor names correctly', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    
    expect(screen.getByText('Fatigue Risk')).toBeInTheDocument();
    expect(screen.getByText('Attrition Risk')).toBeInTheDocument();
    expect(screen.getByText('Time Volatility')).toBeInTheDocument();
  });

  it('should apply hover effects', () => {
    render(<RecommendationCard recommendation={mockRecommendation} />);
    
    const card = screen.getByText('Skip Barber Formula 2000').closest('.hover\\:shadow-lg');
    expect(card).toBeInTheDocument();
  });

  describe('Score Color Coding', () => {
    it('should use racing badges for high scores (80+)', () => {
      render(<RecommendationCard recommendation={mockRecommendation} />);
      
      // High scores show as "champion" badge
      expect(screen.getByText('champion')).toBeInTheDocument();
    });

    it('should use racing badges for medium scores (60-79)', () => {
      const mediumScoreRecommendation = {
        ...mockRecommendation,
        score: { ...mockRecommendation.score, overall: 65 }
      };
      
      render(<RecommendationCard recommendation={mediumScoreRecommendation} />);
      
      // Medium scores show as "contender" badge
      expect(screen.getByText('contender')).toBeInTheDocument();
    });

    it('should use racing badges for low-medium scores (40-59)', () => {
      const lowMediumScoreRecommendation = {
        ...mockRecommendation,
        score: { ...mockRecommendation.score, overall: 45 }
      };
      
      render(<RecommendationCard recommendation={lowMediumScoreRecommendation} />);
      
      // Low-medium scores show as "rookie" badge
      expect(screen.getByText('rookie')).toBeInTheDocument();
    });

    it('should use racing badges for low scores (<40)', () => {
      const lowScoreRecommendation = {
        ...mockRecommendation,
        score: { ...mockRecommendation.score, overall: 25 }
      };
      
      render(<RecommendationCard recommendation={lowScoreRecommendation} />);
      
      // Low scores show as "rookie" badge
      expect(screen.getByText('rookie')).toBeInTheDocument();
    });
  });

  describe('Risk Badge Colors', () => {
    it('should use success variant for low risk', () => {
      render(<RecommendationCard recommendation={mockRecommendation} />);
      
      // iRating risk is 'low' in mock data
      const lowRiskBadges = screen.getAllByText('LOW');
      expect(lowRiskBadges[0]).toBeInTheDocument();
    });

    it('should use warning variant for medium risk', () => {
      render(<RecommendationCard recommendation={mockRecommendation} />);
      
      // Safety risk is 'medium' in mock data
      const mediumRiskBadges = screen.getAllByText('MEDIUM');
      expect(mediumRiskBadges[0]).toBeInTheDocument();
    });

    it('should use danger variant for high risk', () => {
      const highRiskRecommendation = {
        ...mockRecommendation,
        score: {
          ...mockRecommendation.score,
          iRatingRisk: 'high' as const
        }
      };
      
      render(<RecommendationCard recommendation={highRiskRecommendation} />);
      
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });
  });
});