'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Feature Flags Context
 *
 * Temporary local feature flags for debugging and testing UI.
 * These are NOT persisted - they reset on page refresh.
 *
 * Current flags:
 * - mockProfile: Use fake user data for testing (null = use real data)
 *
 * NOTE: This is a development tool. Remove flags once no longer needed.
 */

export type MockProfileId = 'new_driver' | 'road_veteran' | 'oval_specialist' | 'multi_discipline' | 'safety_recovery' | null;

export interface FeatureFlags {
  mockProfile: MockProfileId;
}

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  setMockProfile: (profile: MockProfileId) => void;
  cycleMockProfile: () => void;
}

const defaultFlags: FeatureFlags = {
  mockProfile: null, // Default to real data
};

const MOCK_PROFILES: MockProfileId[] = [null, 'new_driver', 'road_veteran', 'oval_specialist', 'multi_discipline', 'safety_recovery'];

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);

  const setMockProfile = (profile: MockProfileId) => {
    setFlags((prev) => ({
      ...prev,
      mockProfile: profile,
    }));
  };

  const cycleMockProfile = () => {
    setFlags((prev) => {
      const currentIndex = MOCK_PROFILES.indexOf(prev.mockProfile);
      const nextIndex = (currentIndex + 1) % MOCK_PROFILES.length;
      return {
        ...prev,
        mockProfile: MOCK_PROFILES[nextIndex],
      };
    });
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, setMockProfile, cycleMockProfile }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
