/**
 * Tests for AnalyticsMode enum and AnalyticsModeHelper
 */

import { AnalyticsMode, AnalyticsModeHelper, isAnalyticsMode } from '../analytics';

describe('AnalyticsMode Enum', () => {
  describe('AnalyticsModeHelper.isValid', () => {
    test('should validate correct analytics mode values', () => {
      expect(AnalyticsModeHelper.isValid('metrics')).toBe(true);
      expect(AnalyticsModeHelper.isValid('trends')).toBe(true);
      expect(AnalyticsModeHelper.isValid('comparison')).toBe(true);
      expect(AnalyticsModeHelper.isValid('seasons')).toBe(true);
    });

    test('should reject invalid analytics mode values', () => {
      expect(AnalyticsModeHelper.isValid('invalid')).toBe(false);
      expect(AnalyticsModeHelper.isValid('')).toBe(false);
      expect(AnalyticsModeHelper.isValid('METRICS')).toBe(false); // Case sensitive
    });
  });

  describe('AnalyticsModeHelper.normalize', () => {
    test('should normalize valid modes', () => {
      expect(AnalyticsModeHelper.normalize('metrics')).toBe(AnalyticsMode.METRICS);
      expect(AnalyticsModeHelper.normalize('trends')).toBe(AnalyticsMode.TRENDS);
      expect(AnalyticsModeHelper.normalize('comparison')).toBe(AnalyticsMode.COMPARISON);
      expect(AnalyticsModeHelper.normalize('seasons')).toBe(AnalyticsMode.SEASONS);
    });

    test('should handle case insensitive input', () => {
      expect(AnalyticsModeHelper.normalize('METRICS')).toBe(AnalyticsMode.METRICS);
      expect(AnalyticsModeHelper.normalize('Trends')).toBe(AnalyticsMode.TRENDS);
      expect(AnalyticsModeHelper.normalize('COMPARISON')).toBe(AnalyticsMode.COMPARISON);
    });

    test('should default to metrics for invalid input', () => {
      expect(AnalyticsModeHelper.normalize('invalid')).toBe(AnalyticsMode.METRICS);
      expect(AnalyticsModeHelper.normalize('')).toBe(AnalyticsMode.METRICS);
      expect(AnalyticsModeHelper.normalize('unknown')).toBe(AnalyticsMode.METRICS);
    });
  });

  describe('AnalyticsModeHelper.getDisplayName', () => {
    test('should return correct display names', () => {
      expect(AnalyticsModeHelper.getDisplayName(AnalyticsMode.METRICS)).toBe('Performance Metrics');
      expect(AnalyticsModeHelper.getDisplayName(AnalyticsMode.TRENDS)).toBe('Performance Trends');
      expect(AnalyticsModeHelper.getDisplayName(AnalyticsMode.COMPARISON)).toBe('Session Comparison');
      expect(AnalyticsModeHelper.getDisplayName(AnalyticsMode.SEASONS)).toBe('Season Data');
    });
  });

  describe('AnalyticsModeHelper.getDescription', () => {
    test('should return correct descriptions', () => {
      expect(AnalyticsModeHelper.getDescription(AnalyticsMode.METRICS)).toBe('Detailed performance metrics and statistics');
      expect(AnalyticsModeHelper.getDescription(AnalyticsMode.TRENDS)).toBe('Performance trends over time');
      expect(AnalyticsModeHelper.getDescription(AnalyticsMode.COMPARISON)).toBe('Compare performance across different session types');
      expect(AnalyticsModeHelper.getDescription(AnalyticsMode.SEASONS)).toBe('Available seasons and season data');
    });
  });

  describe('AnalyticsModeHelper.getAllModes', () => {
    test('should return all analytics modes', () => {
      const modes = AnalyticsModeHelper.getAllModes();
      expect(modes).toHaveLength(4);
      expect(modes).toContain(AnalyticsMode.METRICS);
      expect(modes).toContain(AnalyticsMode.TRENDS);
      expect(modes).toContain(AnalyticsMode.COMPARISON);
      expect(modes).toContain(AnalyticsMode.SEASONS);
    });

    test('should return a new array each time', () => {
      const modes1 = AnalyticsModeHelper.getAllModes();
      const modes2 = AnalyticsModeHelper.getAllModes();
      expect(modes1).not.toBe(modes2); // Different array instances
      expect(modes1).toEqual(modes2); // Same content
    });
  });

  describe('Analytics mode feature checking methods', () => {
    test('AnalyticsModeHelper.requiresTimeFiltering', () => {
      expect(AnalyticsModeHelper.requiresTimeFiltering(AnalyticsMode.METRICS)).toBe(true);
      expect(AnalyticsModeHelper.requiresTimeFiltering(AnalyticsMode.TRENDS)).toBe(true);
      expect(AnalyticsModeHelper.requiresTimeFiltering(AnalyticsMode.COMPARISON)).toBe(false);
      expect(AnalyticsModeHelper.requiresTimeFiltering(AnalyticsMode.SEASONS)).toBe(false);
    });

    test('AnalyticsModeHelper.supportsSeriesTrackFiltering', () => {
      expect(AnalyticsModeHelper.supportsSeriesTrackFiltering(AnalyticsMode.METRICS)).toBe(true);
      expect(AnalyticsModeHelper.supportsSeriesTrackFiltering(AnalyticsMode.TRENDS)).toBe(true);
      expect(AnalyticsModeHelper.supportsSeriesTrackFiltering(AnalyticsMode.COMPARISON)).toBe(true);
      expect(AnalyticsModeHelper.supportsSeriesTrackFiltering(AnalyticsMode.SEASONS)).toBe(false);
    });

    test('AnalyticsModeHelper.supportsPagination', () => {
      expect(AnalyticsModeHelper.supportsPagination(AnalyticsMode.METRICS)).toBe(true);
      expect(AnalyticsModeHelper.supportsPagination(AnalyticsMode.TRENDS)).toBe(false);
      expect(AnalyticsModeHelper.supportsPagination(AnalyticsMode.COMPARISON)).toBe(false);
      expect(AnalyticsModeHelper.supportsPagination(AnalyticsMode.SEASONS)).toBe(false);
    });
  });

  describe('isAnalyticsMode type guard', () => {
    test('should correctly identify AnalyticsMode values', () => {
      expect(isAnalyticsMode('metrics')).toBe(true);
      expect(isAnalyticsMode('trends')).toBe(true);
      expect(isAnalyticsMode('comparison')).toBe(true);
      expect(isAnalyticsMode('seasons')).toBe(true);
      expect(isAnalyticsMode('invalid')).toBe(false);
      expect(isAnalyticsMode(123)).toBe(false);
      expect(isAnalyticsMode(null)).toBe(false);
      expect(isAnalyticsMode(undefined)).toBe(false);
    });
  });
});

describe('AnalyticsMode Enum Values', () => {
  test('should have correct string values', () => {
    expect(AnalyticsMode.METRICS).toBe('metrics');
    expect(AnalyticsMode.TRENDS).toBe('trends');
    expect(AnalyticsMode.COMPARISON).toBe('comparison');
    expect(AnalyticsMode.SEASONS).toBe('seasons');
  });

  test('should have consistent values', () => {
    expect(AnalyticsMode.METRICS).toBe('metrics');
    expect(AnalyticsMode.TRENDS).toBe('trends');
    expect(AnalyticsMode.COMPARISON).toBe('comparison');
    expect(AnalyticsMode.SEASONS).toBe('seasons');
  });
});