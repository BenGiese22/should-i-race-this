/**
 * Mock User Profiles for Testing
 *
 * These profiles simulate different types of iRacing users to help
 * test and debug the recommendations UI without needing real data.
 */

import type { RecommendationResponse, ScoredRecommendation, Category } from '@/lib/recommendations/types';
import { LicenseLevel } from '@/lib/types/license';
import type { MockProfileId } from './context';

// Helper to create visual indicators (required by ScoredRecommendation)
function createVisualIndicators(factors: ScoredRecommendation['score']['factors']) {
  const createProgressBar = (value: number) => ({
    value,
    gradient: {
      startColor: '#EF4444',
      midColor: '#F59E0B',
      endColor: '#10B981',
      currentColor: value > 66 ? '#10B981' : value > 33 ? '#F59E0B' : '#EF4444',
      cssGradient: 'linear-gradient(to right, #EF4444, #F59E0B, #10B981)',
    },
    icon: '📊',
    tooltip: `Score: ${value}`,
  });

  return {
    performance: createProgressBar(factors.performance),
    safety: createProgressBar(factors.safety),
    consistency: createProgressBar(factors.consistency),
    predictability: createProgressBar(factors.predictability),
    familiarity: createProgressBar(factors.familiarity),
    fatigueRisk: createProgressBar(factors.fatigueRisk),
    attritionRisk: createProgressBar(factors.attritionRisk),
    timeVolatility: createProgressBar(factors.timeVolatility),
    overall: {
      level: 'contender' as const,
      style: 'flag' as const,
      colors: { primary: '#3B82F6', accent: '#1D4ED8', text: '#FFFFFF' },
      icon: '🏁',
      description: 'Good recommendation',
      racingTheme: { greenFlag: true },
    },
  };
}

// Helper to create a scored recommendation
function createRecommendation(
  seriesId: number,
  seriesName: string,
  trackId: number,
  trackName: string,
  category: Category,
  licenseRequired: LicenseLevel,
  factors: Partial<ScoredRecommendation['score']['factors']>,
  confidence: 'high' | 'estimated' | 'no_data' = 'high',
  options: {
    raceLength?: number;
    hasOpenSetup?: boolean;
    timeSlots?: number;
  } = {}
): ScoredRecommendation {
  const fullFactors = {
    performance: factors.performance ?? 50,
    safety: factors.safety ?? 50,
    consistency: factors.consistency ?? 50,
    predictability: factors.predictability ?? 50,
    familiarity: factors.familiarity ?? 0,
    fatigueRisk: factors.fatigueRisk ?? 50,
    attritionRisk: factors.attritionRisk ?? 50,
    timeVolatility: factors.timeVolatility ?? 50,
  };

  const overall = Math.round(
    (fullFactors.performance + fullFactors.safety + fullFactors.consistency +
     fullFactors.familiarity + (100 - fullFactors.fatigueRisk)) / 5
  );

  return {
    seriesId,
    seriesName,
    trackId,
    trackName,
    category,
    licenseRequired,
    seasonYear: 2025,
    seasonQuarter: 1,
    raceWeekNum: 3,
    raceLength: options.raceLength ?? 25,
    hasOpenSetup: options.hasOpenSetup ?? false,
    timeSlots: Array.from({ length: options.timeSlots ?? 12 }, (_, i) => ({
      hour: (i * 2) % 24,
      dayOfWeek: 0,
      strengthOfField: 1800 + Math.random() * 400,
      participantCount: 20 + Math.floor(Math.random() * 15),
    })),
    globalStats: {
      avgIncidentsPerRace: 3.5,
      avgFinishPositionStdDev: 4.2,
      avgStrengthOfField: 1850,
      strengthOfFieldVariability: 0.15,
      attritionRate: 0.12,
      avgRaceLength: options.raceLength ?? 25,
    },
    score: {
      overall,
      factors: fullFactors,
      iRatingRisk: overall > 60 ? 'low' : overall > 40 ? 'moderate' : 'high',
      safetyRatingRisk: fullFactors.safety > 60 ? 'low' : fullFactors.safety > 40 ? 'moderate' : 'high',
      reasoning: [
        fullFactors.familiarity > 50 ? 'You have experience at this track' : 'New track for you',
        fullFactors.safety > 60 ? 'Low incident rate expected' : 'Watch for incidents',
        fullFactors.performance > 60 ? 'Good position gain potential' : 'Challenging field',
      ],
      dataConfidence: {
        performance: confidence,
        safety: confidence,
        consistency: confidence,
        familiarity: fullFactors.familiarity > 0 ? 'high' : 'no_data',
        globalStats: 'high',
      },
      priorityScore: fullFactors.familiarity,
    },
    visualIndicators: createVisualIndicators(fullFactors),
  };
}

/**
 * New Driver Profile
 * - Just started iRacing, mostly Rookie licenses
 * - Limited race history
 * - Focus on MX-5 and other beginner series
 */
const newDriverProfile: RecommendationResponse = {
  recommendations: [
    createRecommendation(
      234, 'Global Mazda MX-5 Fanatec Cup',
      238, 'Laguna Seca',
      'sports_car', LicenseLevel.ROOKIE,
      { performance: 45, safety: 55, consistency: 40, familiarity: 30 },
      'high',
      { raceLength: 15, hasOpenSetup: false, timeSlots: 24 }
    ),
    createRecommendation(
      235, 'Rookie Mazda MX-5 Cup',
      116, 'Lime Rock Park',
      'sports_car', LicenseLevel.ROOKIE,
      { performance: 50, safety: 60, consistency: 45, familiarity: 20 },
      'estimated',
      { raceLength: 12, hasOpenSetup: false, timeSlots: 24 }
    ),
    createRecommendation(
      236, 'Formula Vee',
      119, 'Summit Point Raceway',
      'formula_car', LicenseLevel.ROOKIE,
      { performance: 40, safety: 50, consistency: 35, familiarity: 0 },
      'no_data',
      { raceLength: 12, hasOpenSetup: false, timeSlots: 12 }
    ),
    createRecommendation(
      240, 'ARCA Menards Series',
      191, 'Daytona International Speedway',
      'oval', LicenseLevel.ROOKIE,
      { performance: 35, safety: 40, consistency: 30, familiarity: 10 },
      'estimated',
      { raceLength: 20, hasOpenSetup: false, timeSlots: 6 }
    ),
  ],
  userProfile: {
    primaryCategory: 'sports_car',
    licenseClasses: [
      { category: 'sports_car', level: LicenseLevel.ROOKIE, safetyRating: 2.8, iRating: 1150 },
      { category: 'formula_car', level: LicenseLevel.ROOKIE, safetyRating: 2.5, iRating: 1100 },
      { category: 'oval', level: LicenseLevel.ROOKIE, safetyRating: 2.2, iRating: 1050 },
    ],
    experienceSummary: {
      totalRaces: 12,
      seriesWithExperience: 2,
      tracksWithExperience: 4,
      mostRacedSeries: [
        { seriesId: 234, seriesName: 'Global Mazda MX-5 Fanatec Cup', raceCount: 8 },
        { seriesId: 235, seriesName: 'Rookie Mazda MX-5 Cup', raceCount: 4 },
      ],
      mostRacedTracks: [
        { trackId: 238, trackName: 'Laguna Seca', raceCount: 5 },
        { trackId: 116, trackName: 'Lime Rock Park', raceCount: 4 },
      ],
    },
  },
  metadata: {
    totalOpportunities: 15,
    highConfidenceCount: 1,
    estimatedCount: 2,
    noDataCount: 12,
    cacheStatus: 'miss',
  },
};

/**
 * Road Veteran Profile
 * - Experienced road racer with A license
 * - Strong GT3/GTE history
 * - Very familiar with popular tracks
 */
const roadVeteranProfile: RecommendationResponse = {
  recommendations: [
    createRecommendation(
      399, 'IMSA iRacing Series',
      119, 'Watkins Glen International',
      'sports_car', LicenseLevel.A,
      { performance: 78, safety: 82, consistency: 75, familiarity: 90 },
      'high',
      { raceLength: 45, hasOpenSetup: true, timeSlots: 6 }
    ),
    createRecommendation(
      400, 'VRS GT Sprint Series',
      116, 'Spa-Francorchamps',
      'sports_car', LicenseLevel.B,
      { performance: 72, safety: 78, consistency: 70, familiarity: 85 },
      'high',
      { raceLength: 40, hasOpenSetup: true, timeSlots: 8 }
    ),
    createRecommendation(
      401, 'GT3 Fanatec Challenge',
      246, 'Mount Panorama Circuit',
      'sports_car', LicenseLevel.B,
      { performance: 68, safety: 70, consistency: 65, familiarity: 60 },
      'high',
      { raceLength: 35, hasOpenSetup: true, timeSlots: 6 }
    ),
    createRecommendation(
      402, 'Porsche Cup',
      230, 'Silverstone Circuit',
      'sports_car', LicenseLevel.C,
      { performance: 65, safety: 75, consistency: 68, familiarity: 70 },
      'high',
      { raceLength: 30, hasOpenSetup: false, timeSlots: 12 }
    ),
    createRecommendation(
      403, 'Ferrari GT3 Challenge',
      58, 'Autodromo Nazionale Monza',
      'sports_car', LicenseLevel.C,
      { performance: 70, safety: 65, consistency: 60, familiarity: 55 },
      'estimated',
      { raceLength: 30, hasOpenSetup: false, timeSlots: 8 }
    ),
    createRecommendation(
      305, 'Grand Prix Series',
      168, 'Suzuka International Racing Course',
      'formula_car', LicenseLevel.A,
      { performance: 55, safety: 60, consistency: 50, familiarity: 30 },
      'estimated',
      { raceLength: 50, hasOpenSetup: true, timeSlots: 4 }
    ),
  ],
  userProfile: {
    primaryCategory: 'sports_car',
    licenseClasses: [
      { category: 'sports_car', level: LicenseLevel.A, safetyRating: 4.2, iRating: 2850 },
      { category: 'formula_car', level: LicenseLevel.B, safetyRating: 3.5, iRating: 2100 },
      { category: 'oval', level: LicenseLevel.D, safetyRating: 2.8, iRating: 1400 },
    ],
    experienceSummary: {
      totalRaces: 487,
      seriesWithExperience: 12,
      tracksWithExperience: 35,
      mostRacedSeries: [
        { seriesId: 399, seriesName: 'IMSA iRacing Series', raceCount: 156 },
        { seriesId: 400, seriesName: 'VRS GT Sprint Series', raceCount: 98 },
        { seriesId: 401, seriesName: 'GT3 Fanatec Challenge', raceCount: 87 },
      ],
      mostRacedTracks: [
        { trackId: 119, trackName: 'Watkins Glen International', raceCount: 45 },
        { trackId: 116, trackName: 'Spa-Francorchamps', raceCount: 42 },
        { trackId: 230, trackName: 'Silverstone Circuit', raceCount: 38 },
      ],
    },
  },
  metadata: {
    totalOpportunities: 45,
    highConfidenceCount: 28,
    estimatedCount: 12,
    noDataCount: 5,
    cacheStatus: 'hit',
  },
};

/**
 * Oval Specialist Profile
 * - NASCAR Cup and Xfinity focus
 * - High oval license, basic road
 * - Strong superspeedway and intermediate experience
 */
const ovalSpecialistProfile: RecommendationResponse = {
  recommendations: [
    createRecommendation(
      141, 'NASCAR Cup Series',
      191, 'Daytona International Speedway',
      'oval', LicenseLevel.A,
      { performance: 80, safety: 72, consistency: 78, familiarity: 95 },
      'high',
      { raceLength: 60, hasOpenSetup: true, timeSlots: 4 }
    ),
    createRecommendation(
      142, 'NASCAR Xfinity Series',
      33, 'Charlotte Motor Speedway',
      'oval', LicenseLevel.B,
      { performance: 75, safety: 78, consistency: 80, familiarity: 88 },
      'high',
      { raceLength: 45, hasOpenSetup: true, timeSlots: 6 }
    ),
    createRecommendation(
      143, 'NASCAR Truck Series',
      134, 'Atlanta Motor Speedway',
      'oval', LicenseLevel.C,
      { performance: 72, safety: 75, consistency: 70, familiarity: 75 },
      'high',
      { raceLength: 35, hasOpenSetup: false, timeSlots: 8 }
    ),
    createRecommendation(
      144, 'ARCA Menards Series',
      169, 'Talladega Superspeedway',
      'oval', LicenseLevel.D,
      { performance: 60, safety: 55, consistency: 50, familiarity: 82 },
      'high',
      { raceLength: 30, hasOpenSetup: false, timeSlots: 12 }
    ),
    createRecommendation(
      145, 'Late Model Stock',
      292, 'Martinsville Speedway',
      'oval', LicenseLevel.D,
      { performance: 68, safety: 80, consistency: 72, familiarity: 70 },
      'high',
      { raceLength: 25, hasOpenSetup: false, timeSlots: 12 }
    ),
    createRecommendation(
      234, 'Global Mazda MX-5 Fanatec Cup',
      238, 'Laguna Seca',
      'sports_car', LicenseLevel.ROOKIE,
      { performance: 40, safety: 45, consistency: 35, familiarity: 5 },
      'no_data',
      { raceLength: 15, hasOpenSetup: false, timeSlots: 24 }
    ),
  ],
  userProfile: {
    primaryCategory: 'oval',
    licenseClasses: [
      { category: 'oval', level: LicenseLevel.A, safetyRating: 4.5, iRating: 3200 },
      { category: 'sports_car', level: LicenseLevel.ROOKIE, safetyRating: 2.5, iRating: 1250 },
      { category: 'dirt_oval', level: LicenseLevel.C, safetyRating: 3.2, iRating: 1800 },
    ],
    experienceSummary: {
      totalRaces: 623,
      seriesWithExperience: 8,
      tracksWithExperience: 22,
      mostRacedSeries: [
        { seriesId: 141, seriesName: 'NASCAR Cup Series', raceCount: 245 },
        { seriesId: 142, seriesName: 'NASCAR Xfinity Series', raceCount: 178 },
        { seriesId: 143, seriesName: 'NASCAR Truck Series', raceCount: 112 },
      ],
      mostRacedTracks: [
        { trackId: 191, trackName: 'Daytona International Speedway', raceCount: 89 },
        { trackId: 33, trackName: 'Charlotte Motor Speedway', raceCount: 76 },
        { trackId: 169, trackName: 'Talladega Superspeedway', raceCount: 65 },
      ],
    },
  },
  metadata: {
    totalOpportunities: 32,
    highConfidenceCount: 22,
    estimatedCount: 5,
    noDataCount: 5,
    cacheStatus: 'hit',
  },
};

/**
 * Multi-Discipline Profile
 * - Races everything
 * - B/C license across all categories
 * - Moderate experience in many series
 */
const multiDisciplineProfile: RecommendationResponse = {
  recommendations: [
    createRecommendation(
      399, 'IMSA iRacing Series',
      119, 'Watkins Glen International',
      'sports_car', LicenseLevel.B,
      { performance: 62, safety: 68, consistency: 60, familiarity: 55 },
      'high',
      { raceLength: 45, hasOpenSetup: true, timeSlots: 6 }
    ),
    createRecommendation(
      142, 'NASCAR Xfinity Series',
      33, 'Charlotte Motor Speedway',
      'oval', LicenseLevel.B,
      { performance: 58, safety: 65, consistency: 55, familiarity: 50 },
      'high',
      { raceLength: 45, hasOpenSetup: true, timeSlots: 6 }
    ),
    createRecommendation(
      305, 'Grand Prix Series',
      73, 'Nurburgring Grand-Prix-Strecke',
      'formula_car', LicenseLevel.B,
      { performance: 55, safety: 60, consistency: 52, familiarity: 45 },
      'estimated',
      { raceLength: 50, hasOpenSetup: true, timeSlots: 4 }
    ),
    createRecommendation(
      260, 'World of Outlaws Sprint Cars',
      353, 'Eldora Speedway',
      'dirt_oval', LicenseLevel.C,
      { performance: 50, safety: 55, consistency: 48, familiarity: 40 },
      'estimated',
      { raceLength: 20, hasOpenSetup: true, timeSlots: 8 }
    ),
    createRecommendation(
      261, 'Pro 4 Off-Road Racing Series',
      354, 'Wild West Motorsports Park',
      'dirt_road', LicenseLevel.C,
      { performance: 48, safety: 52, consistency: 45, familiarity: 35 },
      'estimated',
      { raceLength: 15, hasOpenSetup: false, timeSlots: 12 }
    ),
    createRecommendation(
      234, 'Global Mazda MX-5 Fanatec Cup',
      238, 'Laguna Seca',
      'sports_car', LicenseLevel.ROOKIE,
      { performance: 70, safety: 75, consistency: 68, familiarity: 80 },
      'high',
      { raceLength: 15, hasOpenSetup: false, timeSlots: 24 }
    ),
  ],
  userProfile: {
    primaryCategory: 'sports_car',
    licenseClasses: [
      { category: 'sports_car', level: LicenseLevel.B, safetyRating: 3.4, iRating: 2100 },
      { category: 'oval', level: LicenseLevel.B, safetyRating: 3.2, iRating: 1950 },
      { category: 'formula_car', level: LicenseLevel.B, safetyRating: 3.0, iRating: 1850 },
      { category: 'dirt_oval', level: LicenseLevel.C, safetyRating: 2.8, iRating: 1600 },
      { category: 'dirt_road', level: LicenseLevel.C, safetyRating: 2.6, iRating: 1500 },
    ],
    experienceSummary: {
      totalRaces: 312,
      seriesWithExperience: 18,
      tracksWithExperience: 45,
      mostRacedSeries: [
        { seriesId: 234, seriesName: 'Global Mazda MX-5 Fanatec Cup', raceCount: 65 },
        { seriesId: 399, seriesName: 'IMSA iRacing Series', raceCount: 48 },
        { seriesId: 142, seriesName: 'NASCAR Xfinity Series', raceCount: 42 },
      ],
      mostRacedTracks: [
        { trackId: 238, trackName: 'Laguna Seca', raceCount: 28 },
        { trackId: 119, trackName: 'Watkins Glen International', raceCount: 25 },
        { trackId: 33, trackName: 'Charlotte Motor Speedway', raceCount: 22 },
      ],
    },
  },
  metadata: {
    totalOpportunities: 85,
    highConfidenceCount: 35,
    estimatedCount: 30,
    noDataCount: 20,
    cacheStatus: 'miss',
  },
};

/**
 * Safety Recovery Profile
 * - Recent bad races with high incidents
 * - Needs to rebuild safety rating
 * - Should see recommendations prioritizing safe series
 */
const safetyRecoveryProfile: RecommendationResponse = {
  recommendations: [
    createRecommendation(
      234, 'Global Mazda MX-5 Fanatec Cup',
      116, 'Lime Rock Park',
      'sports_car', LicenseLevel.D,
      { performance: 55, safety: 85, consistency: 70, familiarity: 75 },
      'high',
      { raceLength: 15, hasOpenSetup: false, timeSlots: 24 }
    ),
    createRecommendation(
      402, 'Porsche Cup',
      62, 'Brands Hatch Circuit',
      'sports_car', LicenseLevel.C,
      { performance: 50, safety: 78, consistency: 65, familiarity: 60 },
      'high',
      { raceLength: 20, hasOpenSetup: false, timeSlots: 12 }
    ),
    createRecommendation(
      401, 'GT3 Fanatec Challenge',
      226, 'Road America',
      'sports_car', LicenseLevel.B,
      { performance: 45, safety: 72, consistency: 55, familiarity: 40 },
      'estimated',
      { raceLength: 30, hasOpenSetup: true, timeSlots: 8 }
    ),
    createRecommendation(
      399, 'IMSA iRacing Series',
      119, 'Watkins Glen International',
      'sports_car', LicenseLevel.B,
      { performance: 40, safety: 65, consistency: 50, familiarity: 50 },
      'high',
      { raceLength: 45, hasOpenSetup: true, timeSlots: 6 }
    ),
    createRecommendation(
      403, 'Ferrari GT3 Challenge',
      315, 'Circuit of The Americas',
      'sports_car', LicenseLevel.C,
      { performance: 42, safety: 58, consistency: 45, familiarity: 25 },
      'estimated',
      { raceLength: 25, hasOpenSetup: false, timeSlots: 8 }
    ),
  ],
  userProfile: {
    primaryCategory: 'sports_car',
    licenseClasses: [
      { category: 'sports_car', level: LicenseLevel.B, safetyRating: 2.1, iRating: 2450 },
      { category: 'formula_car', level: LicenseLevel.C, safetyRating: 2.4, iRating: 1800 },
      { category: 'oval', level: LicenseLevel.D, safetyRating: 2.0, iRating: 1350 },
    ],
    experienceSummary: {
      totalRaces: 245,
      seriesWithExperience: 9,
      tracksWithExperience: 28,
      mostRacedSeries: [
        { seriesId: 399, seriesName: 'IMSA iRacing Series', raceCount: 78 },
        { seriesId: 401, seriesName: 'GT3 Fanatec Challenge', raceCount: 65 },
        { seriesId: 234, seriesName: 'Global Mazda MX-5 Fanatec Cup', raceCount: 45 },
      ],
      mostRacedTracks: [
        { trackId: 119, trackName: 'Watkins Glen International', raceCount: 32 },
        { trackId: 116, trackName: 'Spa-Francorchamps', raceCount: 28 },
        { trackId: 238, trackName: 'Laguna Seca', raceCount: 24 },
      ],
    },
  },
  metadata: {
    totalOpportunities: 42,
    highConfidenceCount: 18,
    estimatedCount: 15,
    noDataCount: 9,
    cacheStatus: 'hit',
  },
};

/**
 * Profile metadata for display
 */
export const MOCK_PROFILE_INFO: Record<Exclude<MockProfileId, null>, { name: string; description: string }> = {
  new_driver: {
    name: 'New Driver',
    description: 'Just started - Rookie licenses, 12 races',
  },
  road_veteran: {
    name: 'Road Veteran',
    description: 'A-class road racer, 487 races, GT3/IMSA focus',
  },
  oval_specialist: {
    name: 'Oval Specialist',
    description: 'NASCAR A-class, 623 races, superspeedway expert',
  },
  multi_discipline: {
    name: 'Multi-Discipline',
    description: 'B-class everything, 312 races across all categories',
  },
  safety_recovery: {
    name: 'Safety Recovery',
    description: 'Low SR (2.1), needs to rebuild safety rating',
  },
};

/**
 * Get mock profile data by ID
 */
export function getMockProfile(profileId: MockProfileId): RecommendationResponse | null {
  switch (profileId) {
    case 'new_driver':
      return newDriverProfile;
    case 'road_veteran':
      return roadVeteranProfile;
    case 'oval_specialist':
      return ovalSpecialistProfile;
    case 'multi_discipline':
      return multiDisciplineProfile;
    case 'safety_recovery':
      return safetyRecoveryProfile;
    default:
      return null;
  }
}
