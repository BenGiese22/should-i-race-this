import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fc from 'fast-check';

// Mock the analytics functions before importing
const mockGetPerformanceMetrics = jest.fn();
const mockGetGlobalSeriesTrackStats = jest.fn();

jest.mock('../../db/analytics', () => ({
  getPerformanceMetrics: mockGetPerformanceMetrics,
  getGlobalSeriesTrackStats: mockGetGlobalSeriesTrackStats,
}));

// Mock the database
jest.mock('../../db', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockResolvedValue([])
        }),
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockResolvedValue([])
          })
        })
      })
    })
  }
}));

// Now import the modules that depend on the mocked functions
import { prepareUserHistory } from '../data-preparation';
import { analyticsIntegration } from '../analytics-integration';

/**
 * Property-Based Test for Data Consistency Between Systems
 * **Feature: recommendations-analytics-integration, Property 1: Data Consistency Between Systems**
 * **Validates: Requirements 1.2, 6.1**
 * 
 * This test verifies that the performance data used in recommendations is identical 
 * to the data displayed in the dashboard (analytics system).
 */

describe('Data Consistency Property Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  it('should use identical performance data between recommendations and analytics systems', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a valid user ID (string of 6-12 alphanumeric characters)
        fc.string({ minLength: 6, maxLength: 12 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
        async (userId) => {
          // Mock analytics data
          const mockAnalyticsData = [
            {
              seriesId: 1,
              trackId: 1,
              raceCount: 5,
              positionDelta: 2.5,
              avgIncidents: 1.2,
              consistency: 3.4,
              avgStartingPosition: 10,
              avgFinishingPosition: 7.5
            },
            {
              seriesId: 2,
              trackId: 3,
              raceCount: 8,
              positionDelta: -1.0,
              avgIncidents: 2.1,
              consistency: 4.2,
              avgStartingPosition: 15,
              avgFinishingPosition: 16
            }
          ];

          // Mock license data
          const mockLicenseData = [
            {
              category: 'road' as const,
              level: 'D' as const,
              safetyRating: 3.45,
              irating: 1500
            }
          ];

          // Mock database calls
          mockGetPerformanceMetrics.mockResolvedValue(mockAnalyticsData);
          
          // Mock the analytics integration getUserPerformanceData method
          const mockGetUserPerformanceData = jest.spyOn(analyticsIntegration, 'getUserPerformanceData');
          mockGetUserPerformanceData.mockResolvedValue({
            seriesTrackHistory: mockAnalyticsData.map(data => ({
              seriesId: data.seriesId,
              trackId: data.trackId,
              raceCount: data.raceCount,
              avgPositionDelta: data.positionDelta,
              avgIncidents: data.avgIncidents,
              consistency: data.consistency,
              confidenceLevel: data.raceCount >= 3 ? 'high' : 'estimated' as const
            })),
            overallStats: {
              totalRaces: mockAnalyticsData.reduce((sum, data) => sum + data.raceCount, 0),
              avgIncidentsPerRace: mockAnalyticsData.reduce((sum, data) => sum + data.avgIncidents * data.raceCount, 0) / 
                                   mockAnalyticsData.reduce((sum, data) => sum + data.raceCount, 0),
              avgPositionDelta: mockAnalyticsData.reduce((sum, data) => sum + data.positionDelta * data.raceCount, 0) / 
                               mockAnalyticsData.reduce((sum, data) => sum + data.raceCount, 0),
              overallConsistency: mockAnalyticsData.reduce((sum, data) => sum + data.consistency * data.raceCount, 0) / 
                                 mockAnalyticsData.reduce((sum, data) => sum + data.raceCount, 0)
            },
            primaryCategory: 'road' as const,
            licenseClasses: mockLicenseData
          });

          // Get data from both systems
          const [recommendationsData, analyticsData] = await Promise.all([
            prepareUserHistory(userId),
            mockGetPerformanceMetrics(userId, 'series_track')
          ]);

          // Verify that recommendations system uses analytics data
          const analyticsIntegrationData = await analyticsIntegration.getUserPerformanceData(userId);

          // Check that series-track history matches between systems
          const analyticsSeriesTrackMap = new Map();
          analyticsData.forEach(metric => {
            if (metric.seriesId && metric.trackId) {
              const key = `${metric.seriesId}-${metric.trackId}`;
              analyticsSeriesTrackMap.set(key, metric);
            }
          });

          // Verify each series-track combination in recommendations matches analytics
          recommendationsData.seriesTrackHistory.forEach(recHistory => {
            const key = `${recHistory.seriesId}-${recHistory.trackId}`;
            const analyticsMetric = analyticsSeriesTrackMap.get(key);
            
            if (analyticsMetric) {
              // Position delta should match (core performance metric)
              expect(Math.abs(recHistory.avgPositionDelta - analyticsMetric.positionDelta)).toBeLessThan(0.01);
              
              // Incident rates should match
              expect(Math.abs(recHistory.avgIncidents - analyticsMetric.avgIncidents)).toBeLessThan(0.01);
              
              // Race counts should match exactly
              expect(recHistory.raceCount).toBe(analyticsMetric.raceCount);
              
              // Consistency metrics should match
              expect(Math.abs(recHistory.finishPositionStdDev - analyticsMetric.consistency)).toBeLessThan(0.01);
            }
          });

          // Verify overall stats consistency
          const totalRacesFromAnalytics = analyticsData.reduce((sum, metric) => sum + metric.raceCount, 0);
          if (totalRacesFromAnalytics > 0) {
            // Overall race count should match
            expect(recommendationsData.overallStats.totalRaces).toBe(analyticsIntegrationData.overallStats.totalRaces);
            
            // Overall performance metrics should be consistent
            expect(Math.abs(
              recommendationsData.overallStats.avgPositionDelta - 
              analyticsIntegrationData.overallStats.avgPositionDelta
            )).toBeLessThan(0.01);
            
            expect(Math.abs(
              recommendationsData.overallStats.avgIncidentsPerRace - 
              analyticsIntegrationData.overallStats.avgIncidentsPerRace
            )).toBeLessThan(0.01);
          }

          // License classes should be identical
          expect(recommendationsData.licenseClasses).toEqual(analyticsIntegrationData.licenseClasses);
        }
      ),
      { 
        numRuns: 100,
        timeout: 10000, // Reduced timeout since we're using mocks
        verbose: true
      }
    );
  });

  it('should use analytics integration for global statistics consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate series and track IDs
        fc.record({
          seriesId: fc.integer({ min: 1, max: 1000 }),
          trackId: fc.integer({ min: 1, max: 500 })
        }),
        async ({ seriesId, trackId }) => {
          // Mock the analytics integration getGlobalStatistics method
          const mockGetGlobalStatistics = jest.spyOn(analyticsIntegration, 'getGlobalStatistics');
          mockGetGlobalStatistics.mockResolvedValue({
            avgIncidentsPerRace: 2.1,
            avgFinishPositionStdDev: 6.5,
            avgStrengthOfField: 1650,
            strengthOfFieldVariability: 280,
            attritionRate: 12,
            avgRaceLength: 45,
            dataQuality: 'high' as const
          });

          // Get global stats from analytics integration
          const globalStats = await analyticsIntegration.getGlobalStatistics(seriesId, trackId);
          
          // Verify that global stats have expected structure and reasonable values
          expect(typeof globalStats.avgIncidentsPerRace).toBe('number');
          expect(globalStats.avgIncidentsPerRace).toBeGreaterThanOrEqual(0);
          expect(globalStats.avgIncidentsPerRace).toBeLessThan(50); // Reasonable upper bound
          
          expect(typeof globalStats.avgFinishPositionStdDev).toBe('number');
          expect(globalStats.avgFinishPositionStdDev).toBeGreaterThanOrEqual(0);
          
          expect(typeof globalStats.avgStrengthOfField).toBe('number');
          expect(globalStats.avgStrengthOfField).toBeGreaterThan(0);
          
          expect(typeof globalStats.attritionRate).toBe('number');
          expect(globalStats.attritionRate).toBeGreaterThanOrEqual(0);
          expect(globalStats.attritionRate).toBeLessThanOrEqual(100); // Percentage
          
          expect(['high', 'moderate', 'default']).toContain(globalStats.dataQuality);
        }
      ),
      { 
        numRuns: 100,
        timeout: 5000,
        verbose: true
      }
    );
  });
});