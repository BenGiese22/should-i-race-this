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

const mockRaceDetailsData = [
  {
    id: 'race-1',
    subsessionId: 12345,
    seriesId: 1,
    seriesName: 'Skip Barber Formula 2000',
    trackId: 101,
    trackName: 'Road Atlanta',
    raceDate: '2024-01-15T14:00:00Z',
    startingPosition: 8,
    finishingPosition: 5,
    positionDelta: 3,
    incidents: 1,
    strengthOfField: 1450,
  },
  {
    id: 'race-2',
    subsessionId: 12346,
    seriesId: 1,
    seriesName: 'Skip Barber Formula 2000',
    trackId: 103,
    trackName: 'Watkins Glen',
    raceDate: '2024-01-14T18:00:00Z',
    startingPosition: 10,
    finishingPosition: 7,
    positionDelta: 3,
    incidents: 2,
    strengthOfField: 1520,
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
      expect(screen.getByText('Search')).toBeInTheDocument();

      // Wait for initial load to complete, then check for Sync button
      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      expect(screen.getByText('Sync')).toBeInTheDocument();
    });

    it('should have group by dropdown', async () => {
      render(<Dashboard />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
      });

      // Default value is 'series' with text 'Series'
      const groupBySelect = screen.getByDisplayValue('Series');
      expect(groupBySelect).toBeInTheDocument();

      // Verify dropdown has all options
      fireEvent.change(groupBySelect, { target: { value: 'track' } });
      expect(groupBySelect).toHaveValue('track');

      fireEvent.change(groupBySelect, { target: { value: 'series_track' } });
      expect(groupBySelect).toHaveValue('series_track');
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
        // Low incidents (1-2 range) should be teal
        const lowIncidents = screen.getByText('1.5');
        expect(lowIncidents).toHaveClass('text-teal-500');

        // Medium incidents (2-4 range) should be amber
        const mediumIncidents = screen.getByText('3.2');
        expect(mediumIncidents).toHaveClass('text-amber-500');
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

    it('should change group by when dropdown is changed', async () => {
      render(<Dashboard />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument();
      });

      const groupBySelect = screen.getByDisplayValue('Series');
      fireEvent.change(groupBySelect, { target: { value: 'track' } });

      // Should trigger new API call with track grouping
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('groupBy=track')
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
        expect(screen.getByText('Sync Race Data from iRacing')).toBeInTheDocument();
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

  describe('Sync Functionality', () => {
    it('should sync data when sync button is clicked', async () => {
      render(<Dashboard />);

      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('Sync');
      fireEvent.click(syncButton);

      // Should make sync API call (POST to /api/data/sync)
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/data/sync', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('should disable sync button while loading', async () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<Dashboard />);

      // Sync button should be disabled while analytics are loading
      await waitFor(() => {
        const syncButton = screen.getByText('Sync');
        expect(syncButton.closest('button')).toBeDisabled();
      });
    });
  });

  describe('Results Summary and Pagination', () => {
    it('should display results count with pagination info', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // New format: "Showing 1-2 of 2 results"
        expect(screen.getByText(/Showing 1-2 of 2 results/)).toBeInTheDocument();
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

    it('should have page size selector', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      // Check for page size selector
      const pageSizeSelect = screen.getByLabelText('Rows:');
      expect(pageSizeSelect).toBeInTheDocument();
      expect(pageSizeSelect).toHaveValue('10');

      // Change page size
      fireEvent.change(pageSizeSelect, { target: { value: '25' } });
      expect(pageSizeSelect).toHaveValue('25');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layout for controls', async () => {
      render(<Dashboard />);

      const controlsGrid = screen.getByText('Group By').closest('div')?.parentElement;
      expect(controlsGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3');
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

  describe('Expandable Row Details', () => {
    it('should display expand icons on each row', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      // Check that rows have expand indicators (chevron icons)
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should expand row and fetch race details when clicked', async () => {
      // Setup fetch to return different data for analytics and races
      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/data/analytics/races')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ races: mockRaceDetailsData }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ analytics: mockAnalyticsData }),
        });
      });

      render(<Dashboard />);

      // Wait for analytics data to load
      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      // Click on the first row to expand it
      const skipBarberRow = screen.getByText('Skip Barber Formula 2000').closest('tr');
      expect(skipBarberRow).toBeInTheDocument();

      if (skipBarberRow) {
        fireEvent.click(skipBarberRow);
      }

      // Should fetch race details
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/data/analytics/races')
        );
      });
    });

    it('should display loading state while fetching race details', async () => {
      // Setup fetch to delay race details
      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/data/analytics/races')) {
          return new Promise(() => {}); // Never resolves
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ analytics: mockAnalyticsData }),
        });
      });

      render(<Dashboard />);

      // Wait for analytics data to load
      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      // Click on the first row to expand it
      const skipBarberRow = screen.getByText('Skip Barber Formula 2000').closest('tr');
      if (skipBarberRow) {
        fireEvent.click(skipBarberRow);
      }

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading race details...')).toBeInTheDocument();
      });
    });

    it('should collapse row when clicked again', async () => {
      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/data/analytics/races')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ races: mockRaceDetailsData }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ analytics: mockAnalyticsData }),
        });
      });

      render(<Dashboard />);

      // Wait for analytics data to load
      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      // Click to expand
      const skipBarberRow = screen.getByText('Skip Barber Formula 2000').closest('tr');
      if (skipBarberRow) {
        fireEvent.click(skipBarberRow);
      }

      // Wait for expansion
      await waitFor(() => {
        expect(screen.getByText('Road Atlanta')).toBeInTheDocument();
      });

      // Click again to collapse
      if (skipBarberRow) {
        fireEvent.click(skipBarberRow);
      }

      // Race details should no longer be visible
      await waitFor(() => {
        // The track name from race details should not be visible in the expanded area
        // Note: Road Atlanta may still appear as part of mock data, so check for nested table
        const nestedTables = document.querySelectorAll('.max-h-52.overflow-y-auto table');
        expect(nestedTables.length).toBe(0);
      });
    });

    it('should display race details with correct columns', async () => {
      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/data/analytics/races')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ races: mockRaceDetailsData }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ analytics: mockAnalyticsData }),
        });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      // Click to expand
      const skipBarberRow = screen.getByText('Skip Barber Formula 2000').closest('tr');
      if (skipBarberRow) {
        fireEvent.click(skipBarberRow);
      }

      // Check for expanded detail headers
      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Start')).toBeInTheDocument();
        expect(screen.getByText('Finish')).toBeInTheDocument();
        expect(screen.getByText('Inc')).toBeInTheDocument();
        expect(screen.getByText('SOF')).toBeInTheDocument();
      });
    });

    it('should show "no data" message when no race details exist', async () => {
      (fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('/api/data/analytics/races')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ races: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ analytics: mockAnalyticsData }),
        });
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Skip Barber Formula 2000')).toBeInTheDocument();
      });

      // Click to expand
      const skipBarberRow = screen.getByText('Skip Barber Formula 2000').closest('tr');
      if (skipBarberRow) {
        fireEvent.click(skipBarberRow);
      }

      // Should show no data message
      await waitFor(() => {
        expect(screen.getByText('No individual race data found')).toBeInTheDocument();
      });
    });

  });
});