// Types for the recommendation engine
import { LicenseLevel } from '../types/license';
import { 
  RecommendationMode, 
  RiskLevel, 
  ConfidenceLevel
} from '../types/recommendation';
import { Category } from '../types/category';

// Re-export the enums for backward compatibility
export { RecommendationMode, RiskLevel, ConfidenceLevel, Category };

export interface RacingOpportunity {
  seriesId: number;
  seriesName: string;
  trackId: number;
  trackName: string;
  licenseRequired: LicenseLevel;
  category: Category;
  seasonYear: number;
  seasonQuarter: number;
  raceWeekNum: number;
  raceLength: number; // in minutes
  hasOpenSetup: boolean;
  timeSlots: TimeSlot[];
  globalStats: GlobalStats;
  repeatMinutes?: number | null; // How often races repeat (null for fixed schedule)
}

export interface TimeSlot {
  hour: number; // 0-23 UTC
  dayOfWeek: number; // 0-6, Sunday = 0
  strengthOfField: number;
  participantCount: number;
}

export interface GlobalStats {
  avgIncidentsPerRace: number;
  avgFinishPositionStdDev: number;
  avgStrengthOfField: number;
  strengthOfFieldVariability: number;
  attritionRate: number; // percentage of drivers who don't finish
  avgRaceLength: number; // in minutes
}

export interface UserHistory {
  userId: string;
  seriesTrackHistory: SeriesTrackHistory[];
  overallStats: UserOverallStats;
  licenseClasses: LicenseClass[];
}

export interface SeriesTrackHistory {
  seriesId: number;
  trackId: number;
  raceCount: number;
  avgStartingPosition: number;
  avgFinishingPosition: number;
  avgPositionDelta: number;
  avgIncidents: number;
  finishPositionStdDev: number;
  lastRaceDate: Date;
}

export interface UserOverallStats {
  totalRaces: number;
  avgIncidentsPerRace: number;
  avgPositionDelta: number;
  overallConsistency: number; // lower is better
}

export interface LicenseClass {
  category: Category;
  level: LicenseLevel;
  safetyRating: number;
  iRating: number;
}

export interface ScoringFactors {
  performance: number; // 0-100, higher is better
  safety: number; // 0-100, higher is better (lower incidents)
  consistency: number; // 0-100, higher is better (lower std dev)
  predictability: number; // 0-100, higher is better (lower field variability)
  familiarity: number; // 0-100, higher is better (more starts)
  fatigueRisk: number; // 0-100, lower is better (higher fatigue risk)
  attritionRisk: number; // 0-100, lower is better (higher attrition)
  timeVolatility: number; // 0-100, lower is better (higher volatility)
}

export interface Score {
  overall: number; // 0-100
  factors: ScoringFactors;
  iRatingRisk: RiskLevel;
  safetyRatingRisk: RiskLevel;
  reasoning: string[];
  dataConfidence: DataConfidence;
  priorityScore: number; // Higher for familiar series/tracks
}

export interface DataConfidence {
  performance: ConfidenceLevel;
  safety: ConfidenceLevel;
  consistency: ConfidenceLevel;
  familiarity: ConfidenceLevel;
  globalStats: 'high' | 'moderate' | 'default';
}

export interface ScoredOpportunity extends RacingOpportunity {
  score: Score;
}

export interface ModeWeights {
  performance: number;
  safety: number;
  consistency: number;
  predictability: number;
  familiarity: number;
  fatigueRisk: number;
  attritionRisk: number;
  timeVolatility: number;
}

// Visual Scoring Types
export interface VisualScoring {
  performance: ProgressBar;
  safety: ProgressBar;
  consistency: ProgressBar;
  predictability: ProgressBar;
  familiarity: ProgressBar;
  fatigueRisk: ProgressBar;
  attritionRisk: ProgressBar;
  timeVolatility: ProgressBar;
  overall: RacingBadge;
}

export interface ProgressBar {
  value: number; // 0-100
  gradient: GradientColor;
  icon: string; // Racing-themed icon
  tooltip: string;
}

export interface GradientColor {
  startColor: string; // Red at 0
  midColor: string;   // Yellow/Orange at 50  
  endColor: string;   // Green at 100
  currentColor: string; // Interpolated color at current score
  cssGradient: string; // CSS gradient string for styling
}

export interface RacingBadge {
  level: 'rookie' | 'contender' | 'champion' | 'legend';
  style: 'flag' | 'trophy' | 'helmet' | 'podium';
  colors: {
    primary: string;
    accent: string;
    text: string;
  };
  icon: string; // Racing-themed icon
  description: string;
  racingTheme: RacingBadgeTheme;
}

export interface RacingBadgeTheme {
  // Flag-based themes (Racing-Authentic)
  checkeredFlag?: boolean;    // Excellent recommendation (90-100)
  greenFlag?: boolean;        // Good to go / recommended (75-89)
  yellowFlag?: boolean;       // Caution / moderate risk (50-74)
  blackFlag?: boolean;        // Disqualified / not recommended (0-49)
  
  // Trophy/Achievement themes  
  trophy?: 'gold' | 'silver' | 'bronze';
  podiumPosition?: 1 | 2 | 3;
  
  // Racing element themes
  helmet?: 'champion' | 'veteran' | 'rookie';
  raceNumber?: number;        // Like a race car number
  teamColors?: string[];      // Racing team color scheme
}

export interface ConfidenceBadge {
  text: string; // "High Confidence", "Estimated", "No Personal Data"
  color: string;
  icon: string;
  description: string;
}

export interface ScoredRecommendation extends RacingOpportunity {
  score: Score;
  visualIndicators: VisualScoring;
}

export interface ExperienceSummary {
  totalRaces: number;
  seriesWithExperience: number;
  tracksWithExperience: number;
  mostRacedSeries: { seriesId: number; seriesName: string; raceCount: number }[];
  mostRacedTracks: { trackId: number; trackName: string; raceCount: number }[];
}

export interface RecommendationResponse {
  recommendations: ScoredRecommendation[];
  userProfile: {
    primaryCategory: Category;
    licenseClasses: LicenseClass[];
    experienceSummary: ExperienceSummary;
  };
  userHistory: UserHistory;
  metadata: {
    totalOpportunities: number;
    highConfidenceCount: number;
    estimatedCount: number;
    noDataCount: number;
    cacheStatus: 'hit' | 'miss';
    processingTimeMs?: number; // Performance optimization metric
    cacheHitRate?: number; // Performance optimization metric
  };
}

export type ScoringFactor = 'performance' | 'safety' | 'consistency' | 'predictability' | 
                           'familiarity' | 'fatigueRisk' | 'attritionRisk' | 'timeVolatility';