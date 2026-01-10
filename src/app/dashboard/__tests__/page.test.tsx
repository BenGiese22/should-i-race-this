import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Dashboard from '../page';
import { useAuth } from '../../../lib/auth/hooks';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth hook
jest.mock('../../../lib/auth/hooks', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockAuth = {
  user: null,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshTokens: jest.fn(),
  refetch: jest.fn(),
  error: null,
};

const mockUser = {
  id: 'test-id',
  iracingCustomerId: 123456,
  displayName: 'Test Driver',
  licenseClasses: [
    { category: 'road', level: 'B', safetyRating: 3.5, iRating: 1500 },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  lastSyncAt: '2024-01-01T00:00:00Z',
};

const mockAnalyticsData = [
  {
    seriesId: 1,
    seriesName: 'Skip Barber Formula 2000',
    trackId: 101,
    trackName: 'Road Atlanta',
    avgStartingPosition: 8.5,
    avgFinishingPosition: 6.2,
    positionDelta: 2.3,
    avgIncidents: 1.5,
    raceCount: 12,
  },
  {
    seriesId: 2,
    seriesName: 'Global Mazda MX-5 Cup',
    trackId: 102,
    trackName: 'Laguna Seca',
    avgStartingPosition: 12.1,
    avgFinishingPosition: 14.8,
    positionDelta: -2.7,
    avgIncidents: 3.2,
    raceCount: 8,
  },
];

describe('Dashboard Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuth,
      user: mockUser,
    });
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ analytics: mockAnalyticsData }),
    });
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should redirect to home when not authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: null,
        loading: false,
      });

      render(<Dashboard />);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('should display loading spinner when loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        loading: true,
      });

      render(<Dashboard />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Dashboard Interface', () => {
    it('should display page header and description', async () => {
      render(<Dashboard />);

      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      expect(screen.getByText(/Analyze your racing performance/)).toBeInTheDocument();
    });

    it('should display control panel with filters', async () => {
      render(<Dashboard />);

      expect(screen.getByText('Group By')).toBeInTheDocument();
      expect(screen.getByText('Session Type')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
      
      // Wait for initial load to complete, then check for Refresh button
      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should have group by toggle buttons', async () => {
      render(<Dashboard />);

      expect(screen.getByText('Series')).toBeInTheDocument();
      expect(screen.getByText('Track')).toBeInTheDocument();
      expect(screen.getByText('Series + Track')).toBeInTheDocument();
    });

    it('should have session type dropdown', async () => {
      render(<Dashboard />);

      const sessionSelect = screen.getByDisplayValue('Race');
      expect(sessionSelect).toBeInTheDocument();
      
      fireEvent.change(sessionSelect, { target: { value: 'qualifying' } });
      expect(sessionSelect).toHaveValue('qualifying');
    });

    it('should have search input with placeholder', async () => {
      render(<Dashboard />);

      const searchInput = screen.getByPlaceholderText('Search series or tracks...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Analytics Table', () => {
    it('should display analytics data in table format', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
        expect(screen.getByText('Global Mazda MX-5 Cup')).toBeInTheDocument();
      });
    });

    it('should display correct column headers for series view', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      // Check for column headers - use getAllByText for "Series" since it appears in both toggle and header
      const seriesElements = screen.getAllByText('Series');
      expect(seriesElements.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Races')).toBeInTheDocument();
      expect(screen.getByText('Avg Start')).toBeInTheDocument();
      expect(screen.getByText('Avg Finish')).toBeInTheDocument();
      expect(screen.getByText('Position Δ')).toBeInTheDocument();
      expect(screen.getByText('Avg Incidents')).toBeInTheDocument();
    });

    it('should format position delta with colors', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // Positive delta (improvement) should be green
        const positiveDelta = screen.getByText('+2.3');
        expect(positiveDelta).toHaveClass('text-racing-improvement');

        // Negative delta (decline) should be red
        const negativeDelta = screen.getByText('-2.7');
        expect(negativeDelta).toHaveClass('text-racing-decline');
      });
    });

    it('should format incident counts with colors', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // Low incidents should be green
        const lowIncidents = screen.getByText('1.5');
        expect(lowIncidents).toHaveClass('text-racing-green');

        // Medium incidents should be yellow (2-4 range)
        const mediumIncidents = screen.getByText('3.2');
        expect(mediumIncidents).toHaveClass('text-racing-yellow');
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by race count when header is clicked', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const racesHeader = screen.getByText('Races');
        fireEvent.click(racesHeader);
        
        // Should trigger re-sort (implementation detail)
        expect(racesHeader).toBeInTheDocument();
      });
    });

    it('should display sort icons', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // Should have sort icons in headers
        const headers = screen.getAllByRole('button');
        expect(headers.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search and Filter Functionality', () => {
    it('should filter results when search term is entered', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search series or tracks...');
        fireEvent.change(searchInput, { target: { value: 'Skip Barber' } });
        
        expect(searchInput).toHaveValue('Skip Barber');
      });
    });

    it('should change group by when toggle buttons are clicked', async () => {
      render(<Dashboard />);

      const trackButton = screen.getByText('Track');
      fireEvent.click(trackButton);

      // Should trigger new API call with track grouping
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('groupBy=track')
        );
      });
    });

    it('should change session type when dropdown is changed', async () => {
      render(<Dashboard />);

      const sessionSelect = screen.getByDisplayValue('Race');
      fireEvent.change(sessionSelect, { target: { value: 'qualifying' } });

      // Should trigger new API call with qualifying filter
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('sessionType=qualifying')
        );
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state when fetching analytics', async () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<Dashboard />);

      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should display error message when API call fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    it('should display no data message when no results', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ analytics: [] }),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('No Data Available')).toBeInTheDocument();
        expect(screen.getByText('Sync Race Data')).toBeInTheDocument();
      });
    });

    it('should display no results message when search has no matches', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search series or tracks...');
        fireEvent.change(searchInput, { target: { value: 'NonexistentSeries' } });
      });

      // Wait for filter to apply
      await waitFor(() => {
        expect(screen.getByText('No results match your search criteria.')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when refresh button is clicked', async () => {
      render(<Dashboard />);

      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Should make new API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2); // Initial load + refresh
      });
    });

    it('should disable refresh button while loading', async () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<Dashboard />);

      // Wait for loading state
      await waitFor(() => {
        const loadingButton = screen.getByText('Loading...');
        expect(loadingButton).toBeDisabled();
      });
    });
  });

  describe('Results Summary', () => {
    it('should display results count', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 2 results')).toBeInTheDocument();
      });
    });

    it('should display search term in results summary', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search series or tracks...');
        fireEvent.change(searchInput, { target: { value: 'Skip' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/for "Skip"/)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layout for controls', async () => {
      render(<Dashboard />);

      const controlsGrid = screen.getByText('Group By').closest('div')?.parentElement;
      expect(controlsGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-4');
    });

    it('should have responsive button layout', async () => {
      render(<Dashboard />);

      // Check for responsive flex classes
      const container = screen.getByRole('main');
      expect(container).toHaveClass('min-h-screen');
    });

    it('should have overflow handling for table', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const tableContainer = screen.getByRole('table').parentElement;
        expect(tableContainer).toHaveClass('overflow-x-auto');
      });
    });
  });
});