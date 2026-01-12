/**
 * Tests for Session Type Enum System
 */

import { describe, test, expect } from '@jest/globals';
import { SessionType, SessionTypeHelper } from '../session';

describe('SessionType Enum', () => {
  test('should have correct enum values', () => {
    expect(SessionType.PRACTICE).toBe('practice');
    expect(SessionType.QUALIFYING).toBe('qualifying');
    expect(SessionType.TIME_TRIAL).toBe('time_trial');
    expect(SessionType.RACE).toBe('race');
  });

  test('should validate session types correctly', () => {
    expect(SessionTypeHelper.isValid('practice')).toBe(true);
    expect(SessionTypeHelper.isValid('qualifying')).toBe(true);
    expect(SessionTypeHelper.isValid('time_trial')).toBe(true);
    expect(SessionTypeHelper.isValid('race')).toBe(true);
    expect(SessionTypeHelper.isValid('invalid')).toBe(false);
  });

  test('should get display names', () => {
    expect(SessionTypeHelper.getDisplayName(SessionType.PRACTICE)).toBe('Practice');
    expect(SessionTypeHelper.getDisplayName(SessionType.QUALIFYING)).toBe('Qualifying');
    expect(SessionTypeHelper.getDisplayName(SessionType.TIME_TRIAL)).toBe('Time Trial');
    expect(SessionTypeHelper.getDisplayName(SessionType.RACE)).toBe('Race');
  });

  test('should identify competitive sessions', () => {
    expect(SessionTypeHelper.isCompetitive(SessionType.PRACTICE)).toBe(false);
    expect(SessionTypeHelper.isCompetitive(SessionType.QUALIFYING)).toBe(true);
    expect(SessionTypeHelper.isCompetitive(SessionType.TIME_TRIAL)).toBe(true);
    expect(SessionTypeHelper.isCompetitive(SessionType.RACE)).toBe(true);
  });

  test('should sort by priority correctly', () => {
    const unsorted = [SessionType.RACE, SessionType.PRACTICE, SessionType.TIME_TRIAL, SessionType.QUALIFYING];
    const sorted = SessionTypeHelper.sortByPriority(unsorted);
    
    expect(sorted).toEqual([
      SessionType.PRACTICE,
      SessionType.QUALIFYING,
      SessionType.TIME_TRIAL,
      SessionType.RACE
    ]);
  });

  test('should normalize from event type', () => {
    expect(SessionTypeHelper.normalizeFromEventType(2)).toBe(SessionType.PRACTICE);
    expect(SessionTypeHelper.normalizeFromEventType(3)).toBe(SessionType.QUALIFYING);
    expect(SessionTypeHelper.normalizeFromEventType(4)).toBe(SessionType.TIME_TRIAL);
    expect(SessionTypeHelper.normalizeFromEventType(5)).toBe(SessionType.RACE);
  });

  test('should normalize from session name patterns', () => {
    expect(SessionTypeHelper.normalizeFromEventType(999, 'Practice Session')).toBe(SessionType.PRACTICE);
    expect(SessionTypeHelper.normalizeFromEventType(999, 'Qualifying')).toBe(SessionType.QUALIFYING);
    expect(SessionTypeHelper.normalizeFromEventType(999, 'Time Trial')).toBe(SessionType.TIME_TRIAL);
    expect(SessionTypeHelper.normalizeFromEventType(999, 'Feature Race')).toBe(SessionType.RACE);
    expect(SessionTypeHelper.normalizeFromEventType(999, 'Lone Qualify')).toBe(SessionType.TIME_TRIAL);
  });

  test('should convert from string safely', () => {
    expect(SessionTypeHelper.tryFromString('practice')).toBe(SessionType.PRACTICE);
    expect(SessionTypeHelper.tryFromString('invalid')).toBe(null);
  });

  test('should throw on invalid string conversion', () => {
    expect(() => SessionTypeHelper.fromString('invalid')).toThrow('Invalid session type: invalid');
  });
});