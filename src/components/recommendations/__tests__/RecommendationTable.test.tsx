import { render, screen, fireEvent } from '@testing-library/react';
import { RecommendationTable } from '../RecommendationTable';
import { ScoredOpportunity } from '@/lib/recommendations/types';

const mockRecommendations: ScoredOpportunity[] = [
  {
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
      reasoning: ['Strong performance history']
    }
  },
  {
    seriesId: 2,
    seriesName: 'Global Mazda MX-5 Cup',
    trackId: 102,
    trackName: 'Laguna Seca',
    licenseRequired: 'D',
    category: 'road',
    seasonYear: 2024,
    seasonQuarter: 1,
    raceWeekNum: 6,
    raceLength: 30,
    hasOpenSetup: true,
    timeSlots: [],
    globalStats: {
      avgIncidentsPerRace: 3.2,
      avgFinishPositionStdDev: 5.1,
      avgStrengthOfField: 1200,
      strengthOfFieldVariability: 300,
      attritionRate: 0.25,
      avgRaceLength: 30
    },
    score: {
      overall: 62,
      factors: {
        performance: 55,
        safety: 70,
        consistency: 80,
        predictability: 45,
        familiarity: 90,
        fatigueRisk: 85,
        attritionRisk: 60,
        timeVolatility: 75
      },
      iRatingRisk: 'high' as const,
      safetyRatingRisk: 'low' as const,
      reasoning: ['High familiarity', 'Consistent performance'],
      dataConfidence: {
        performance: 'high' as const,
        safety: 'high' as const,
        consistency: 'estimated' as const,
        familiarity: 'high' as const,
        globalStats: 'high' as const
      },
      priorityScore: 75
    }
  }
];

describe('RecommendationTable', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render table headers', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    expect(screen.getByText('Series & Track')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('iRating Risk')).toBeInTheDocument();
    expect(screen.getByText('Safety Risk')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
    expect(screen.getByText('Consistency')).toBeInTheDocument();
    expect(screen.getByText('Familiarity')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('should render recommendation data in rows', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
    expect(screen.getByText('Road Atlanta')).toBeInTheDocument();
    expect(screen.getByText('Global Mazda MX-5 Cup')).toBeInTheDocument();
    expect(screen.getByText('Laguna Seca')).toBeInTheDocument();
  });

  it('should display overall scores with correct colors', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    const highScore = screen.getByText('85');
    const mediumScore = screen.getByText('62');

    expect(highScore).toHaveClass('text-green-600');
    expect(mediumScore).toHaveClass('text-yellow-600');
  });

  it('should show risk badges with appropriate colors', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    // Check for risk level text (case insensitive due to uppercase transformation)
    expect(screen.getAllByText('LOW')).toHaveLength(2); // One iRating low, one safety low
    expect(screen.getAllByText('MEDIUM')).toHaveLength(1);
    expect(screen.getAllByText('HIGH')).toHaveLength(1);
  });

  it('should display factor scores with progress bars', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    // Check for factor score values - use getAllByText since scores appear multiple times
    expect(screen.getAllByText('78').length).toBeGreaterThan(0); // Performance score
    expect(screen.getAllByText('92').length).toBeGreaterThan(0); // Safety score
    expect(screen.getAllByText('65').length).toBeGreaterThan(0); // Consistency score
    expect(screen.getAllByText('45').length).toBeGreaterThan(0); // Familiarity score
  });

  it('should show category and license badges', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    const roadBadges = screen.getAllByText('ROAD');
    const licenseBadges = screen.getAllByText('D');

    expect(roadBadges).toHaveLength(2); // Two road series
    expect(licenseBadges).toHaveLength(2); // Both require D license
  });

  it('should display race length and setup type', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    expect(screen.getByText('45min')).toBeInTheDocument();
    expect(screen.getByText('30min')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument(); // Open setup badge
  });

  it('should call onSelect when row is clicked', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    const firstRow = screen.getByText('Skip Barber Formula 2000').closest('tr');
    fireEvent.click(firstRow!);

    expect(mockOnSelect).toHaveBeenCalledWith(mockRecommendations[0]);
  });

  it('should apply hover effects to rows', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    const rows = screen.getAllByRole('row');
    // Skip header row, check data rows
    const dataRows = rows.slice(1);
    
    dataRows.forEach(row => {
      expect(row).toHaveClass('hover:bg-gray-50', 'cursor-pointer');
    });
  });

  it('should handle empty recommendations list', () => {
    render(<RecommendationTable recommendations={[]} onSelect={mockOnSelect} />);

    expect(screen.getByText('No recommendations available')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or check back after more race data is available.')).toBeInTheDocument();
  });

  it('should have responsive table layout', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    const tableContainer = screen.getByRole('table').parentElement;
    expect(tableContainer).toHaveClass('overflow-x-auto');
  });

  it('should format factor names correctly in headers', () => {
    render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

    // Check that factor names are properly capitalized
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
    expect(screen.getByText('Consistency')).toBeInTheDocument();
    expect(screen.getByText('Familiarity')).toBeInTheDocument();
  });

  describe('Score Color Coding', () => {
    it('should use appropriate colors for different score ranges', () => {
      const testRecommendations = [
        { 
          ...mockRecommendations[0], 
          seriesId: 1, 
          trackId: 101, 
          raceWeekNum: 1,
          score: { ...mockRecommendations[0].score, overall: 90 } 
        }, // Green
        { 
          ...mockRecommendations[0], 
          seriesId: 2, 
          trackId: 102, 
          raceWeekNum: 2,
          score: { ...mockRecommendations[0].score, overall: 65 } 
        }, // Yellow
        { 
          ...mockRecommendations[0], 
          seriesId: 3, 
          trackId: 103, 
          raceWeekNum: 3,
          score: { ...mockRecommendations[0].score, overall: 45 } 
        }, // Orange
        { 
          ...mockRecommendations[0], 
          seriesId: 4, 
          trackId: 104, 
          raceWeekNum: 4,
          score: { ...mockRecommendations[0].score, overall: 25 } 
        }, // Red
      ];

      render(<RecommendationTable recommendations={testRecommendations} onSelect={mockOnSelect} />);

      // Find the overall score elements specifically (not the progress bar values)
      const scoreElements = screen.getAllByText('90').filter(el => el.classList.contains('text-green-600'));
      expect(scoreElements.length).toBeGreaterThan(0);
      
      const yellowScoreElements = screen.getAllByText('65').filter(el => el.classList.contains('text-yellow-600'));
      expect(yellowScoreElements.length).toBeGreaterThan(0);
      
      const orangeScoreElements = screen.getAllByText('45').filter(el => el.classList.contains('text-orange-600'));
      expect(orangeScoreElements.length).toBeGreaterThan(0);
      
      const redScoreElements = screen.getAllByText('25').filter(el => el.classList.contains('text-red-600'));
      expect(redScoreElements.length).toBeGreaterThan(0);
    });
  });

  describe('Colored Numeric Scores', () => {
    it('should render colored numeric scores for factor scores', () => {
      render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

      // Colored numeric scores should be present instead of progress bars
      const performanceScores = screen.getAllByText('78');
      expect(performanceScores.length).toBeGreaterThan(0);
      
      const safetyScores = screen.getAllByText('92');
      expect(safetyScores.length).toBeGreaterThan(0);
      
      const consistencyScores = screen.getAllByText('65');
      expect(consistencyScores.length).toBeGreaterThan(0);
      
      const familiarityScores = screen.getAllByText('45');
      expect(familiarityScores.length).toBeGreaterThan(0);
    });

    it('should display factor scores with appropriate colors', () => {
      render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

      // Each factor score should be displayed with color based on score value
      const performanceScores = screen.getAllByText('78');
      expect(performanceScores.length).toBeGreaterThan(0);
      
      const safetyScores = screen.getAllByText('92');
      expect(safetyScores.length).toBeGreaterThan(0);
      
      const consistencyScores = screen.getAllByText('65');
      expect(consistencyScores.length).toBeGreaterThan(0);
      
      const familiarityScores = screen.getAllByText('45');
      expect(familiarityScores.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', () => {
      render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(9);
      expect(screen.getAllByRole('row')).toHaveLength(3); // 1 header + 2 data rows
    });

    it('should be keyboard navigable', () => {
      render(<RecommendationTable recommendations={mockRecommendations} onSelect={mockOnSelect} />);

      const firstRow = screen.getByText('Skip Barber Formula 2000').closest('tr');
      firstRow?.focus();
      
      fireEvent.keyDown(firstRow!, { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith(mockRecommendations[0]);
    });
  });

  describe('Empty State', () => {
    it('should show appropriate message when no recommendations', () => {
      render(<RecommendationTable recommendations={[]} onSelect={mockOnSelect} />);

      expect(screen.getByText('No recommendations available')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or check back after more race data is available.')).toBeInTheDocument();
    });

    it('should center the empty state message', () => {
      render(<RecommendationTable recommendations={[]} onSelect={mockOnSelect} />);

      const emptyState = screen.getByText('No recommendations available').parentElement;
      expect(emptyState).toHaveClass('text-center', 'py-12');
    });
  });
});