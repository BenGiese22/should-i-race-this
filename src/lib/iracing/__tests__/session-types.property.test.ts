/**
 * Property-based tests for session type normalization
 * **Feature: racing-analytics-dashboard, Property 2: Session Type Normalization**
 * **Validates: Requirements 3.3**
 */

import { describe, test, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
  normalizeSessionType,
  getAllSessionTypes,
  isValidSessionType,
  getSessionTypeName,
  isCompetitiveSession,
  getSessionTypePriority,
  type SessionType,
} from '../session-types';

describe('Session Type Normalization Properties', () => {
  /**
   * Property 2: Session Type Normalization
   * For any race result from the iRacing API, the system should correctly normalize 
   * the session type using event type fields or session names into exactly one of: 
   * Practice, Qualifying, Time Trial, or Race.
   */
  test('Property 2: Session type normalization always returns valid session type', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // event type
        fc.option(fc.string({ minLength: 0, maxLength: 50 })), // session name
        fc.option(fc.string({ minLength: 0, maxLength: 50 })), // event type name
        (eventType, sessionName, eventTypeName) => {
          const result = normalizeSessionType(eventType, sessionName || undefined, eventTypeName || undefined);
          
          // Must return one of the valid session types
          expect(isValidSessionType(result)).toBe(true);
          expect(getAllSessionTypes()).toContain(result);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2a: Known event types always map consistently', () => {
    // Known mappings from the implementation
    const knownMappings: Array<[number, SessionType]> = [
      [1, 'race'],
      [2, 'practice'],
      [3, 'practice'],
      [4, 'practice'],
      [5, 'qualifying'],
      [6, 'qualifying'],
      [7, 'time_trial'],
      [8, 'time_trial'],
      [9, 'race'],
      [10, 'race'],
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...knownMappings),
        fc.option(fc.string()),
        fc.option(fc.string()),
        ([eventType, expectedType], sessionName, eventTypeName) => {
          const result = normalizeSessionType(eventType, sessionName || undefined, eventTypeName || undefined);
          expect(result).toBe(expectedType);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2b: Session name patterns are recognized correctly', () => {
    const sessionNamePatterns: Array<[string, SessionType]> = [
      ['Practice Session', 'practice'],
      ['Warmup', 'practice'],
      ['Warm-up', 'practice'],
      ['Qualifying', 'qualifying'],
      ['Qual', 'qualifying'],
      ['Grid Session', 'qualifying'],
      ['Time Trial', 'time_trial'],
      ['Time-Trial', 'time_trial'],
      ['TT', 'time_trial'],
      ['Lone Qualify', 'time_trial'],
      ['Hot Lap', 'time_trial'],
      ['Race', 'race'],
      ['Feature Race', 'race'],
      ['Main Event', 'race'],
      ['Heat Race', 'race'],
      ['Final', 'race'],
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...sessionNamePatterns),
        fc.integer({ min: 100, max: 999 }), // unknown event type
        ([sessionName, expectedType], eventType) => {
          const result = normalizeSessionType(eventType, sessionName);
          expect(result).toBe(expectedType);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2c: Case insensitive pattern matching', () => {
    const caseVariations = ['practice', 'PRACTICE', 'Practice', 'pRaCtIcE'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...caseVariations),
        fc.integer({ min: 100, max: 999 }), // unknown event type
        (sessionName, eventType) => {
          const result = normalizeSessionType(eventType, sessionName);
          expect(result).toBe('practice');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2d: Unknown inputs default to race', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 999 }), // unknown event type
        fc.string().filter(s => 
          !s.toLowerCase().includes('practice') &&
          !s.toLowerCase().includes('warmup') &&
          !s.toLowerCase().includes('qual') &&
          !s.toLowerCase().includes('grid') &&
          !s.toLowerCase().includes('time') &&
          !s.toLowerCase().includes('tt') &&
          !s.toLowerCase().includes('lone') &&
          !s.toLowerCase().includes('hot') &&
          !s.toLowerCase().includes('race') &&
          !s.toLowerCase().includes('feature') &&
          !s.toLowerCase().includes('main') &&
          !s.toLowerCase().includes('heat') &&
          !s.toLowerCase().includes('final')
        ),
        (eventType, sessionName) => {
          const result = normalizeSessionType(eventType, sessionName);
          expect(result).toBe('race');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2e: Session type names are consistent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllSessionTypes()),
        (sessionType) => {
          const name = getSessionTypeName(sessionType);
          expect(typeof name).toBe('string');
          expect(name.length).toBeGreaterThan(0);
          
          // Names should be title case
          expect(name[0]).toBe(name[0].toUpperCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2f: Competitive session classification is consistent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllSessionTypes()),
        (sessionType) => {
          const isCompetitive = isCompetitiveSession(sessionType);
          
          if (sessionType === 'practice') {
            expect(isCompetitive).toBe(false);
          } else {
            expect(isCompetitive).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2g: Session type priorities are ordered correctly', () => {
    const sessionTypes = getAllSessionTypes();
    const priorities = sessionTypes.map(type => ({
      type,
      priority: getSessionTypePriority(type)
    }));
    
    // Practice should have lowest priority number (highest priority)
    expect(priorities.find(p => p.type === 'practice')?.priority).toBe(1);
    
    // Race should have highest priority number (lowest priority)
    expect(priorities.find(p => p.type === 'race')?.priority).toBe(4);
    
    // All priorities should be unique and positive
    const priorityValues = priorities.map(p => p.priority);
    expect(new Set(priorityValues).size).toBe(priorityValues.length);
    expect(priorityValues.every(p => p > 0)).toBe(true);
  });

  test('Property 2h: Normalization is deterministic', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.option(fc.string({ minLength: 0, maxLength: 50 })),
        fc.option(fc.string({ minLength: 0, maxLength: 50 })),
        (eventType, sessionName, eventTypeName) => {
          const result1 = normalizeSessionType(eventType, sessionName || undefined, eventTypeName || undefined);
          const result2 = normalizeSessionType(eventType, sessionName || undefined, eventTypeName || undefined);
          
          // Same inputs should always produce same output
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });
});