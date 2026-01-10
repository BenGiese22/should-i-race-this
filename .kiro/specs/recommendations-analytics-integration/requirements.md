# Requirements Document

## Introduction

The recommendations system currently duplicates analytics functionality and fails to use existing performance data, resulting in inaccurate scoring that doesn't reflect user expertise in specific series like Porsche Cup and GT4. This integration will fix scoring accuracy by leveraging the proven analytics infrastructure.

**Important Note**: The recommendations system only considers actual race sessions (sessionType = 'race') when calculating performance metrics, familiarity scores, and primary category detection. Practice, qualifying, and time trial sessions are excluded from recommendation calculations to ensure scoring reflects competitive race performance only.

## Glossary

- **Analytics_System**: Existing performance data infrastructure (`src/lib/db/analytics.ts`)
- **Recommendations_System**: Racing opportunity scoring system (`src/lib/recommendations/`)
- **Performance_Data**: User's historical race performance metrics (position delta, incidents, consistency)
- **Global_Stats**: Aggregated statistics across all users for series/track combinations
- **Familiarity_Score**: Scoring factor based on user's experience with series/track combinations
- **Category**: Racing discipline classification - one of: "road", "oval", "dirt_road", "dirt_oval" (note: these correspond to road racing, oval racing, dirt road racing, and dirt oval racing respectively)
- **Race_Session**: Only actual race sessions are considered for recommendations (excludes practice, qualifying, and time trial sessions)

## Requirements

### Requirement 1: Centralized Performance Data Standard

**User Story:** As a developer, I want one centralized standard for historical performance data, so that the performance dashboard and recommendations system use identical data sources and calculations.

#### Acceptance Criteria

1. THE System SHALL maintain a single source of truth for all user license data, schedule data, and historical performance data
2. WHEN performance data is displayed in the dashboard, THE same data SHALL be used for recommendations calculations
3. WHEN license information is updated, THE change SHALL be reflected in both dashboard and recommendations immediately
4. WHEN schedule data is synced, THE updated opportunities SHALL be available to both systems simultaneously
5. THE System SHALL NOT maintain separate or duplicate data stores for performance metrics
6. WHEN historical performance calculations are modified, THE changes SHALL apply to both dashboard and recommendations
7. THE centralized performance data SHALL include: position deltas, incident rates, consistency metrics, race counts, and strength of field data

### Requirement 2: Analytics Integration

**User Story:** As a developer, I want the recommendations system to use the existing analytics infrastructure, so that performance data is consistent across the application.

#### Acceptance Criteria

1. WHEN calculating user performance history, THE Recommendations_System SHALL use `getPerformanceMetrics()` from Analytics_System
2. WHEN calculating series-track specific performance, THE Recommendations_System SHALL use `getSeriesTrackPerformance()` from Analytics_System  
3. WHEN calculating global statistics, THE Recommendations_System SHALL use `getGlobalSeriesTrackStats()` from Analytics_System
4. WHEN preparing user history data, THE Recommendations_System SHALL eliminate duplicate database queries
5. THE Recommendations_System SHALL NOT implement separate data preparation logic that duplicates Analytics_System functionality

### Requirement 3: Accurate Familiarity Scoring

**User Story:** As a user with extensive experience in specific racing series, I want my familiarity scores to accurately reflect my series expertise, so that recommendations properly weight my experience.

#### Acceptance Criteria

1. WHEN calculating familiarity for a series where the user has race history, THE System SHALL use actual race count data from Performance_Data
2. WHEN a user has 10+ races in any series, THE familiarity score SHALL be 80+ for that series
3. WHEN a user has 5+ races in any series, THE familiarity score SHALL be 60+ for that series
4. WHEN calculating series experience, THE System SHALL aggregate all tracks within the series from Performance_Data
5. WHEN calculating track experience, THE System SHALL aggregate all series on that track from Performance_Data

### Requirement 4: Real Global Statistics

**User Story:** As a user, I want recommendations based on actual historical race data including incident rates, DNF rates, and field variability, so that safety and performance predictions accurately reflect the volatility of each series-track combination.

#### Acceptance Criteria

1. WHEN calculating global statistics for a series-track combination, THE System SHALL query actual race results from the last 3 months using `getGlobalSeriesTrackStats()`
2. WHEN calculating attrition risk, THE System SHALL use actual DNF rates (finishingPosition IS NULL) from historical data
3. WHEN calculating safety risk, THE System SHALL use actual average incident counts from historical data
4. WHEN calculating predictability, THE System SHALL use actual strength-of-field variability from historical data
5. WHEN calculating consistency expectations, THE System SHALL use actual finish position standard deviation from historical data
6. WHEN no historical data exists for a combination (less than 10 races in 3 months), THE System SHALL use conservative default values
7. THE System SHALL NOT use identical default global statistics for all series-track combinations when real data is available
8. WHEN global statistics are calculated, THE System SHALL cache results for 5 minutes to optimize performance

### Requirement 5: Performance Factor Accuracy and Relevance

**User Story:** As a user, I want performance scores to reflect my actual racing performance and prioritize series/tracks where I have experience, so that recommendations are relevant and I can clearly see when predictions are based on limited data.

#### Acceptance Criteria

1. WHEN calculating performance factors, THE System SHALL use actual position delta data from Performance_Data
2. WHEN a user has 3+ races in a series-track combination, THE System SHALL use that specific performance data and mark it as "High Confidence"
3. WHEN a user lacks specific combination data, THE System SHALL use cross-series performance analysis from Analytics_System and mark it as "Estimated"
4. WHEN calculating safety factors, THE System SHALL use actual incident rates from Performance_Data
5. WHEN calculating consistency factors, THE System SHALL use actual finish position standard deviation from Performance_Data
6. WHEN a user has no personal data for a series-track combination, THE System SHALL clearly indicate "No Personal Data" in the recommendation
7. WHEN sorting recommendations, THE System SHALL prioritize combinations where the user has racing experience (3+ races) over unfamiliar combinations
8. WHEN displaying recommendations, THE System SHALL show data confidence indicators: "High Confidence" (3+ races), "Estimated" (cross-series), "No Personal Data" (defaults only)

### Requirement 6: Data Consistency

**User Story:** As a user, I want the same performance data shown in my dashboard to be used for recommendations, so that the application provides consistent information.

#### Acceptance Criteria

1. WHEN Performance_Data is displayed in the dashboard, THE same data SHALL be used for recommendations scoring
2. WHEN a user's race history is updated, THE recommendations SHALL reflect the updated performance metrics
3. WHEN filtering by session type, THE System SHALL use the same filtering logic as Analytics_System
4. THE System SHALL use the same position delta calculation logic as Analytics_System
5. THE System SHALL use the same data validation rules as Analytics_System (excluding pit starts, invalid positions)

### Requirement 7: Code Maintainability

**User Story:** As a developer, I want a single source of truth for performance data, so that bugs and improvements only need to be implemented once.

#### Acceptance Criteria

1. THE Recommendations_System SHALL remove duplicate functions: `getSeriesTrackHistory()`, `getUserOverallStats()`, `getBatchGlobalStats()`
2. THE Recommendations_System SHALL import and use Analytics_System functions instead of duplicating logic
3. WHEN Analytics_System functions are improved, THE Recommendations_System SHALL automatically benefit from those improvements
4. THE codebase SHALL have no duplicate database queries for the same performance metrics
5. THE System SHALL maintain backward compatibility with existing recommendation API endpoints

### Requirement 8: Performance Optimization

**User Story:** As a user, I want fast recommendation loading times, so that I can quickly evaluate racing opportunities.

#### Acceptance Criteria

1. WHEN loading recommendations, THE System SHALL use existing Analytics_System caching mechanisms
2. WHEN calculating multiple series-track combinations, THE System SHALL use batch queries from Analytics_System
3. THE System SHALL maintain sub-3-second response times for recommendation requests
4. WHEN Analytics_System optimizations are implemented, THE Recommendations_System SHALL benefit automatically
5. THE System SHALL not introduce additional database query overhead compared to current Analytics_System performance

### Requirement 9: Primary Category Detection

**User Story:** As a user who primarily races in one category (e.g., road racing), I want the system to automatically focus on my primary category, so that recommendations are relevant to my main racing discipline.

#### Acceptance Criteria

1. WHEN a user has 70%+ of their race sessions in one category, THE System SHALL identify that as their primary category
2. WHEN loading recommendations without explicit category filter, THE System SHALL default to the user's primary category
3. WHEN a user's primary category is "road", THE System SHALL prioritize road series in recommendations
4. WHEN calculating cross-category performance comparisons, THE System SHALL weight the primary category more heavily
5. THE System SHALL allow users to override the detected primary category if desired
6. THE System SHALL only consider actual race sessions (sessionType = 'race') when determining primary category, excluding practice, qualifying, and time trial sessions

### Requirement 11: Visual Scoring Representation

**User Story:** As a user, I want to see recommendation scores as intuitive visual indicators with racing-themed design, so that I can quickly understand and compare racing opportunities in a context that feels natural for motorsport.

#### Acceptance Criteria

1. WHEN displaying individual scoring factors, THE System SHALL show colored progress bars with racing-themed styling instead of numeric scores
2. WHEN a factor score is 0-33, THE progress bar SHALL be red (low/poor) with racing-appropriate iconography
3. WHEN a factor score is 34-66, THE progress bar SHALL be yellow/orange (moderate) with racing-appropriate iconography  
4. WHEN a factor score is 67-100, THE progress bar SHALL be green (good/high) with racing-appropriate iconography
5. WHEN displaying the overall recommendation score, THE System SHALL use racing-themed visual indicators (e.g., flag colors, racing badges, or track-inspired ratings)
6. WHEN showing confidence levels, THE System SHALL use racing-themed badges with appropriate motorsport terminology and colors
7. THE visual design SHALL maintain consistency with racing aesthetics throughout the recommendations interface
8. THE System SHALL provide tooltips or expandable details for users who want to see the underlying numeric values
9. WHEN comparing multiple recommendations, THE visual indicators SHALL make relative scoring immediately apparent without requiring number comparison
10. THE color scheme and visual elements SHALL complement the existing racing dashboard design language

### Requirement 12: Scoring Validation

**User Story:** As a user, I want to verify that my recommendations accurately reflect my racing expertise, so that I can trust the system's suggestions.

#### Acceptance Criteria

1. WHEN a user has extensive experience in a series, THE familiarity score SHALL be significantly higher than unfamiliar series
2. WHEN a user has consistent performance in a series, THE consistency score SHALL reflect that stability
3. WHEN a user has low incident rates in a series, THE safety score SHALL reflect that safety record
4. THE System SHALL provide debugging endpoints to verify that correct Performance_Data is being used
5. WHEN scoring factors vary significantly, THE System SHALL provide clear reasoning based on actual data differences