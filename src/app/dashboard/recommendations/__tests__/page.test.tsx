/**
 * Unit tests for Recommendations Page
 * 
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecommendationsClient } from '../RecommendationsClient';

// Mock the hooks
jest.mock('../../../lib/hooks', () => ({
  useRecommendations: jest.fn(),
}));

// Mock the racing components
jest.mock('../../../../components/racing', () => ({
  PrimaryRecommendationCard: ({ recommendation, rank }: any) => (
    <div data-testid="primary-card">
      Primary: {recommendation.seriesName} - Rank {rank}
    </div>
  ),
  SecondaryRecommendationCard: ({ recommendation, rank }: any) => (
    <div data-testid="secondary-card">
      Secondary: {recommendation.seriesName} - Rank {rank}
    </div>
  ),
  OtherOptionItem: ({ option }: any) => (
    <div data-testid="other-option">
      Other: {option.seriesName}
    </div>
  ),
  GoalModeSelector: ({ currentMode, onModeChange, disabled }: any) => (
    <div data-testid="mode-selector">
      <button onClick={() => onModeChange('balanced')} disabled={disabled}>
        Balanced
      </button>
      <button onClick={() => onModeChange('push')} disabled={disabled}>
        Push
      </button>
      <button onClick={() => onModeChange('recovery')} disabled={disabled}>
        Recovery
      </button>
      <span>Current: {currentMode}</span>
    </div>
  ),
  EmptyState: ({ type }: any) => (
    <div data-testid="empty-state">Empty: {type}</div>
  ),
  FirstTimeLoadingState: () => (
    <div data-testid="first-time-loading">First Time Loading</div>
  ),
  ReturningUserLoadingState: () => (
    <div data-testid="returning-user-loading">Returning User Loading</div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRecommendation = {
  seriesId: 1,
  trackId: 1,
  seriesName: 'Test Series',
  trackName: 'Test Track',
  licenseClass: 'B',
  totalScore: 85,
};

describe('RecommendationsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ syncStatus: { lastSyncAt: null, totalRaces: 0 } }),
    });
  });

  /**
   * Test that page renders with mock data
   */
  test('renders with recommendations data', async () => {
    const { useRecommendations } = require('../../../lib/hooks');
    useRecommendations.mockReturnValue({
      data: {
        recommendations: [
          mockRecommendation,
          { ...mockRecommendation, seriesId: 2, seriesName: 'Test Series 2' },
          { ...mockRecommendation, seriesId: 3, seriesName: 'Test Series 3' },
          { ...mockRecommendation, seriesId: 4, seriesName: 'Test Series 4' },
        ],
        userProfile: {
          experienceSummary: {
            totalRaces: 100,
            seriesWithExperience: 10,
            tracksWithExperience: 20,
          },
        },
      },
      loading: false,
      error: null,
      isRetrying: false,
      refetch: jest.fn(),
    });

    render(<RecommendationsClient />);

    // Check header
    expect(screen.getByText('What Should I Race?')).toBeInTheDocument();
    
    // Check mode selector
    expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
    
    // Check experience summary
    expect(screen.getByText(/Based on 100 races/)).toBeInTheDocument();
    
    // Check primary recommendation
    expect(screen.getByTestId('primary-card')).toBeInTheDocument();
    expect(screen.getByText(/Primary: Test Series/)).toBeInTheDocument();
    
    // Check secondary recommendations
    const secondaryCards = screen.getAllByTestId('secondary-card');
    expect(secondaryCards).toHaveLength(2);
    
    // Check other options
    const otherOptions = screen.getAllByTestId('other-option');
    expect(otherOptions).toHaveLength(1);
  });

  /**
   * Test loading states display correctly
   */
  test('displays first-time loading state', () => {
    const { useRecommendations } = require('../../../lib/hooks');
    useRecommendations.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      isRetrying: false,
      refetch: jest.fn(),
    });

    render(<RecommendationsClient />);

    expect(screen.getByTestId('first-time-loading')).toBeInTheDocument();
  });

  test('displays returning user loading state', () => {
    const { useRecommendations } = require('../../../lib/hooks');
    useRecommendations.mockReturnValue({
      data: {
        userProfile: { experienceSummary: { totalRaces: 10 } },
      },
      loading: true,
      error: null,
      isRetrying: false,
      refetch: jest.fn(),
    });

    render(<RecommendationsClient />);

    expect(screen.getByTestId('returning-user-loading')).toBeInTheDocument();
  });

  /**
   * Test empty state displays when no recommendations
   */
  test('displays empty state when no recommendations', () => {
    const { useRecommendations } = require('../../../lib/hooks');
    useRecommendations.mockReturnValue({
      data: {
        recommendations: [],
        userProfile: {
          experienceSummary: { totalRaces: 0 },
        },
      },
      loading: false,
      error: null,
      isRetrying: false,
      refetch: jest.fn(),
    });

    render(<RecommendationsClient />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Empty: no-recommendations/)).toBeInTheDocument();
  });

  test('displays no-matching-mode empty state when user has data but no recommendations', () => {
    const { useRecommendations } = require('../../../lib/hooks');
    useRecommendations.mockReturnValue({
      data: {
        recommendations: [],
        userProfile: {
          experienceSummary: { totalRaces: 50 },
        },
      },
      loading: false,
      error: null,
      isRetrying: false,
      refetch: jest.fn(),
    });

    render(<RecommendationsClient />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Empty: no-matching-mode/)).toBeInTheDocument();
  });

  /**
   * Test error boundary catches errors
   */
  test('displays error state on API error', () => {
    const { useRecommendations } = require('../../../lib/hooks');
    const mockError = new Error('Failed to fetch recommendations');
    const mockRefetch = jest.fn();
    
    useRecommendations.mockReturnValue({
      data: null,
      loading: false,
      error: mockError,
      isRetrying: false,
      refetch: mockRefetch,
    });

    render(<RecommendationsClient />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch recommendations/)).toBeInTheDocument();
    
    // Test retry button
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalled();
  });

  /**
   * Test mode selector changes mode
   */
  test('mode selector changes recommendation mode', async () => {
    const { useRecommendations } = require('../../../lib/hooks');
    const mockRefetch = jest.fn();
    
    useRecommendations.mockReturnValue({
      data: {
        recommendations: [mockRecommendation],
        userProfile: {
          experienceSummary: { totalRaces: 10 },
        },
      },
      loading: false,
      error: null,
      isRetrying: false,
      refetch: mockRefetch,
    });

    render(<RecommendationsClient />);

    // Initial mode should be balanced
    expect(screen.getByText('Current: balanced')).toBeInTheDocument();
    
    // Click push mode
    const pushButton = screen.getByText('Push');
    fireEvent.click(pushButton);
    
    // Mode should change
    await waitFor(() => {
      expect(screen.getByText('Current: push')).toBeInTheDocument();
    });
  });

  /**
   * Test sync button functionality
   */
  test('sync button triggers data sync', async () => {
    const { useRecommendations } = require('../../../lib/hooks');
    const mockRefetch = jest.fn();
    
    useRecommendations.mockReturnValue({
      data: {
        recommendations: [mockRecommendation],
        userProfile: {
          experienceSummary: { totalRaces: 10 },
        },
      },
      loading: false,
      error: null,
      isRetrying: false,
      refetch: mockRefetch,
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        syncStatus: { lastSyncAt: new Date().toISOString(), totalRaces: 11 },
      }),
    });

    render(<RecommendationsClient />);

    const syncButton = screen.getByText('Sync');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/data/sync',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
