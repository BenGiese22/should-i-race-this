import { render, screen, fireEvent } from '@testing-library/react';
import { RecommendationCard } from '../RecommendationCard';
import { ScoredRecommendation, RecommendationMode } from '@/lib/recommendations/types';
import { LicenseLevel } from '@/lib/types/license';

const mockRecommendation: ScoredRecommendation = {
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
    { hour: 14, dayOfWeek: 1, strengthOfField: 1500, participantCount: 20 },
    { hour: 18, dayOfWeek: 1, strengthOfField: 1600, participantCount: 24 },
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
  }
};

describe('RecommendationCard', () => {
  const defaultProps = {
    recommendation: mockRecommendation,
    rank: 1,
    mode: 'balanced' as RecommendationMode,
  };

  it('should render series and track names', () => {
    render(<RecommendationCard {...defaultProps} />);

    expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
    // Track name is prefixed with @
    expect(screen.getByText(/Road Atlanta/)).toBeInTheDocument();
  });

  it('should display rank badge', () => {
    render(<RecommendationCard {...defaultProps} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('should display different rank for secondary cards', () => {
    render(<RecommendationCard {...defaultProps} rank={2} variant="secondary" />);

    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('should show license badge', () => {
    render(<RecommendationCard {...defaultProps} />);

    // LicenseBadge component shows the license level
    const licenseBadges = screen.getAllByText('D');
    // Find the one that's inside a span (the license badge)
    const licenseBadge = licenseBadges.find(el => el.tagName === 'SPAN');
    expect(licenseBadge).toBeInTheDocument();
  });

  it('should show confidence badge for high confidence', () => {
    render(<RecommendationCard {...defaultProps} />);

    // High confidence shown with checkmark
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should show confidence badge for estimated data', () => {
    const estimatedRecommendation = {
      ...mockRecommendation,
      score: {
        ...mockRecommendation.score,
        dataConfidence: {
          ...mockRecommendation.score.dataConfidence,
          performance: 'estimated' as const
        }
      }
    };

    render(
      <RecommendationCard
        {...defaultProps}
        recommendation={estimatedRecommendation}
      />
    );

    // Estimated confidence shown with tilde
    expect(screen.getByText('~')).toBeInTheDocument();
  });

  it('should display race length for primary variant', () => {
    render(<RecommendationCard {...defaultProps} variant="primary" />);

    expect(screen.getByText('45m')).toBeInTheDocument();
  });

  it('should show setup type for primary variant', () => {
    render(<RecommendationCard {...defaultProps} variant="primary" />);

    expect(screen.getByText('Fixed')).toBeInTheDocument();
  });

  it('should show open setup when applicable', () => {
    const openSetupRecommendation = {
      ...mockRecommendation,
      hasOpenSetup: true
    };

    render(
      <RecommendationCard
        {...defaultProps}
        recommendation={openSetupRecommendation}
        variant="primary"
      />
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('should show "Why This Race" section with factors', () => {
    render(<RecommendationCard {...defaultProps} />);

    expect(screen.getByText('Why This Race')).toBeInTheDocument();
  });

  it('should show expand/collapse button', () => {
    render(<RecommendationCard {...defaultProps} />);

    expect(screen.getByText('More Details')).toBeInTheDocument();
  });

  it('should expand to show more details when clicked', () => {
    render(<RecommendationCard {...defaultProps} />);

    const expandButton = screen.getByText('More Details');
    fireEvent.click(expandButton);

    // After expanding, should show scoring breakdown
    expect(screen.getByText('Less Details')).toBeInTheDocument();
    expect(screen.getByText('Scoring Breakdown')).toBeInTheDocument();
  });

  it('should collapse when clicked again', () => {
    render(<RecommendationCard {...defaultProps} />);

    const expandButton = screen.getByText('More Details');
    fireEvent.click(expandButton);

    const collapseButton = screen.getByText('Less Details');
    fireEvent.click(collapseButton);

    expect(screen.getByText('More Details')).toBeInTheDocument();
    expect(screen.queryByText('Scoring Breakdown')).not.toBeInTheDocument();
  });

  it('should display next race time for primary variant', () => {
    render(<RecommendationCard {...defaultProps} variant="primary" />);

    // First time slot is 14:00 UTC = 2:00 PM UTC
    expect(screen.getByText(/2:00 PM UTC/)).toBeInTheDocument();
  });

  it('should handle missing time slots gracefully', () => {
    const noTimeSlotsRecommendation = {
      ...mockRecommendation,
      timeSlots: []
    };

    render(
      <RecommendationCard
        {...defaultProps}
        recommendation={noTimeSlotsRecommendation}
        variant="primary"
      />
    );

    expect(screen.getByText('Check schedule')).toBeInTheDocument();
  });

  describe('Mode-specific factor display', () => {
    it('should prioritize performance factors in irating_push mode', () => {
      render(
        <RecommendationCard
          {...defaultProps}
          mode="irating_push"
        />
      );

      // Position Gain should be prominent in iRating push mode
      expect(screen.getByText('Position Gain')).toBeInTheDocument();
    });

    it('should prioritize safety factors in safety_recovery mode', () => {
      render(
        <RecommendationCard
          {...defaultProps}
          mode="safety_recovery"
        />
      );

      // Safety should be prominent in safety recovery mode
      expect(screen.getByText('Safety')).toBeInTheDocument();
    });
  });

  describe('Visual styling', () => {
    it('should apply primary variant styling', () => {
      const { container } = render(
        <RecommendationCard {...defaultProps} variant="primary" />
      );

      // Primary variant has p-6 padding
      expect(container.querySelector('.p-6')).toBeInTheDocument();
    });

    it('should apply secondary variant styling', () => {
      const { container } = render(
        <RecommendationCard {...defaultProps} variant="secondary" />
      );

      // Secondary variant has p-4 padding
      expect(container.querySelector('.p-4')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(
        <RecommendationCard {...defaultProps} className="custom-class" />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});
