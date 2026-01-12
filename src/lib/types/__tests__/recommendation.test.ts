/**
 * Tests for Recommendation System Enums
 */

import { describe, test, expect } from '@jest/globals';
import { 
  RecommendationMode, 
  RiskLevel, 
  ConfidenceLevel,
  RecommendationModeHelper,
  RiskLevelHelper,
  ConfidenceLevelHelper
} from '../recommendation';

describe('RecommendationMode Enum', () => {
  test('should have correct enum values', () => {
    expect(RecommendationMode.BALANCED).toBe('balanced');
    expect(RecommendationMode.IRATING_PUSH).toBe('irating_push');
    expect(RecommendationMode.SAFETY_RECOVERY).toBe('safety_recovery');
  });

  test('should validate modes correctly', () => {
    expect(RecommendationModeHelper.isValid('balanced')).toBe(true);
    expect(RecommendationModeHelper.isValid('irating_push')).toBe(true);
    expect(RecommendationModeHelper.isValid('safety_recovery')).toBe(true);
    expect(RecommendationModeHelper.isValid('invalid')).toBe(false);
  });

  test('should get display names', () => {
    expect(RecommendationModeHelper.getDisplayName(RecommendationMode.BALANCED)).toBe('Balanced');
    expect(RecommendationModeHelper.getDisplayName(RecommendationMode.IRATING_PUSH)).toBe('iRating Push');
    expect(RecommendationModeHelper.getDisplayName(RecommendationMode.SAFETY_RECOVERY)).toBe('Safety Recovery');
  });

  test('should convert from string safely', () => {
    expect(RecommendationModeHelper.tryFromString('balanced')).toBe(RecommendationMode.BALANCED);
    expect(RecommendationModeHelper.tryFromString('invalid')).toBe(null);
  });
});

describe('RiskLevel Enum', () => {
  test('should have correct enum values', () => {
    expect(RiskLevel.LOW).toBe('low');
    expect(RiskLevel.MEDIUM).toBe('medium');
    expect(RiskLevel.HIGH).toBe('high');
  });

  test('should compare risk levels correctly', () => {
    expect(RiskLevelHelper.compare(RiskLevel.LOW, RiskLevel.MEDIUM)).toBeLessThan(0);
    expect(RiskLevelHelper.compare(RiskLevel.MEDIUM, RiskLevel.HIGH)).toBeLessThan(0);
    expect(RiskLevelHelper.compare(RiskLevel.HIGH, RiskLevel.LOW)).toBeGreaterThan(0);
    expect(RiskLevelHelper.compare(RiskLevel.MEDIUM, RiskLevel.MEDIUM)).toBe(0);
  });

  test('should get colors for risk levels', () => {
    expect(RiskLevelHelper.getColor(RiskLevel.LOW)).toBe('#22c55e');
    expect(RiskLevelHelper.getColor(RiskLevel.MEDIUM)).toBe('#eab308');
    expect(RiskLevelHelper.getColor(RiskLevel.HIGH)).toBe('#ef4444');
  });
});

describe('ConfidenceLevel Enum', () => {
  test('should have correct enum values', () => {
    expect(ConfidenceLevel.HIGH).toBe('high');
    expect(ConfidenceLevel.ESTIMATED).toBe('estimated');
    expect(ConfidenceLevel.NO_DATA).toBe('no_data');
  });

  test('should calculate confidence from race count', () => {
    expect(ConfidenceLevelHelper.fromRaceCount(5)).toBe(ConfidenceLevel.HIGH);
    expect(ConfidenceLevelHelper.fromRaceCount(2)).toBe(ConfidenceLevel.ESTIMATED);
    expect(ConfidenceLevelHelper.fromRaceCount(0)).toBe(ConfidenceLevel.NO_DATA);
  });

  test('should compare confidence levels correctly', () => {
    expect(ConfidenceLevelHelper.compare(ConfidenceLevel.HIGH, ConfidenceLevel.ESTIMATED)).toBeGreaterThan(0);
    expect(ConfidenceLevelHelper.compare(ConfidenceLevel.ESTIMATED, ConfidenceLevel.NO_DATA)).toBeGreaterThan(0);
    expect(ConfidenceLevelHelper.compare(ConfidenceLevel.NO_DATA, ConfidenceLevel.HIGH)).toBeLessThan(0);
  });

  test('should get display names and icons', () => {
    expect(ConfidenceLevelHelper.getDisplayName(ConfidenceLevel.HIGH)).toBe('High Confidence');
    expect(ConfidenceLevelHelper.getIcon(ConfidenceLevel.HIGH)).toBe('✅');
    expect(ConfidenceLevelHelper.getIcon(ConfidenceLevel.ESTIMATED)).toBe('📊');
    expect(ConfidenceLevelHelper.getIcon(ConfidenceLevel.NO_DATA)).toBe('❓');
  });
});