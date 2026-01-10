# Scoring Algorithm Reference

This document provides a comprehensive mapping of how iRacing data flows through the 8-factor scoring algorithm to generate race recommendations.

## Overview

The scoring algorithm evaluates racing opportunities using 8 factors, each scored 0-100, then combines them using mode-specific weights to produce an overall recommendation score. Each factor uses different combinations of iRacing data sources.

## Data Sources

### Primary Database Tables
- **`race_results`**: Historical race performance data from iRacing API
- **`license_classes`**: Current license levels and ratings per category
- **`schedule_entries`**: Current week's racing schedule
- **Global stats**: Aggregated statistics computed from race results

### Key iRacing Data Fields
- `starting_position`: Grid position at race start
- `finishing_position`: Final race position
- `position_delta`: Computed field (starting - finishing position)
- `incidents`: Total incident points in race
- `strength_of_field`: Average iRating of race field
- `race_date`: When the race occurred
- `series_id` / `track_id`: Unique identifiers for series/track combinations
- `session_type`: Race, practice, qualifying, time trial
- `irating`: Driver skill rating
- `safety_rating`: Driver safety rating (0.0-5.0+)

## Scoring Factors

### Factor 1: Performance (0-100, higher = better expected finish)

**Purpose**: Predicts how well the user will finish relative to their starting position.

**Data Flow**:
1. **Primary Source**: Series-track specific history from `race_results`
   - Query: `AVG(position_delta)` for user + series + track combination
   - Minimum 3 races required for statistical significance
   
2. **Fallback**: Cross-series performance analysis
   - User's overall `AVG(position_delta)` across all races
   - Adjusted by iRating differential: `(user_irating - opportunity_sof) / 200 * position_adjustment`
   - License level bonus: Pro(+3), A(+2), B(+1), C(0), D(-1), Rookie(-2)

3. **Calculation**:
   ```
   expected_delta = personal_history OR (overall_delta + sof_adjustment + license_bonus)
   normalized_delta = clamp(expected_delta, -10, +10)
   base_score = ((normalized_delta + 10) / 20) * 100
   final_score = (base_score * confidence) + (50 * (1 - confidence))
   ```

**Example**: User with A-license (1492 iRating) in series with 1400 SOF:
- iRating differential: +92 → SOF adjustment: +0.46 positions
- License bonus: +2 positions  
- If overall delta is +1.2, expected delta = 1.2 + 0.46 + 2 = 3.66
- Score = ((3.66 + 10) / 20) * 100 = 68.3

### Factor 2: Safety (0-100, higher = fewer expected incidents)

**Purpose**: Predicts incident risk based on personal and series safety history.

**Data Flow**:
1. **Primary Source**: Series-track specific incidents from `race_results`
   - Query: `AVG(incidents)` for user + series + track combination
   - Minimum 3 races required

2. **Fallback**: Blended personal and global incident rates
   - User's overall `AVG(incidents)` across all races
   - Global series average `AVG(incidents)` for series + track
   - Safety rating adjustment: `(3.0 - safety_rating) * 0.5`

3. **Calculation**:
   ```
   expected_incidents = personal_history OR 
                       (personal_avg * weight + global_avg * (1-weight) + sr_adjustment)
   normalized_incidents = clamp(expected_incidents, 0, 8)
   score = (1 - (normalized_incidents / 8)) * 100
   ```

**Example**: User with 3.5 safety rating, 1.8 personal average, 2.2 global average:
- Safety rating adjustment: (3.0 - 3.5) * 0.5 = -0.25 incidents
- Blended: (1.8 * 0.7) + (2.2 * 0.3) - 0.25 = 1.67 incidents
- Score = (1 - (1.67 / 8)) * 100 = 79.1

### Factor 3: Consistency (0-100, higher = more consistent finishes)

**Purpose**: Measures finish position variability to predict result predictability.

**Data Flow**:
1. **Primary Source**: Series-track specific consistency from `race_results`
   - Query: `STDDEV(finishing_position)` for user + series + track
   - Minimum 5 races required for meaningful standard deviation

2. **Fallback**: Blended personal and global consistency
   - User's overall finish position standard deviation
   - Global series `STDDEV(finishing_position)` for series + track

3. **Calculation**:
   ```
   expected_stddev = personal_history OR 
                    (personal_stddev * weight + global_stddev * (1-weight))
   normalized_stddev = clamp(expected_stddev, 0, 15)
   score = (1 - (normalized_stddev / 15)) * 100
   ```

**Example**: Personal stddev of 6.2, global stddev of 8.5:
- Blended: (6.2 * 0.6) + (8.5 * 0.4) = 7.12
- Score = (1 - (7.12 / 15)) * 100 = 52.5

### Factor 4: Predictability (0-100, higher = more predictable field strength)

**Purpose**: Measures strength-of-field variability to predict competitive consistency.

**Data Flow**:
1. **Source**: Global statistics from `race_results`
   - Query: `STDDEV(strength_of_field)` for series + track combination
   - Computed across last 3 months of race data

2. **User Adjustment**: iRating differential impact
   - If `|user_irating - avg_sof| > 300`: add unpredictability penalty
   - Penalty = `min(200, (irating_diff - 300) / 2)`

3. **Calculation**:
   ```
   base_variability = global_sof_stddev
   irating_penalty = user_far_from_average ? penalty : 0
   adjusted_variability = base_variability + irating_penalty
   normalized_variability = clamp(adjusted_variability, 0, 2000)
   score = (1 - (normalized_variability / 2000)) * 100
   ```

**Example**: SOF stddev of 350, user iRating 1492, average SOF 1400:
- iRating diff: |1492 - 1400| = 92 (< 300, no penalty)
- Score = (1 - (350 / 2000)) * 100 = 82.5

### Factor 5: Familiarity (0-100, higher = more experience)

**Purpose**: Combines series experience, track experience, and exact combination experience.

**Data Flow**:
1. **Exact Match**: Series + track combination from `race_results`
   - Query: `COUNT(*)` for user + series + track
   - Weight: 60% of final score

2. **Series Experience**: All tracks in series from `race_results`
   - Query: `SUM(COUNT(*))` for user + series (all tracks)
   - Weight: 25% of final score

3. **Track Experience**: All series on track from `race_results`
   - Query: `SUM(COUNT(*))` for user + track (all series)
   - Weight: 15% of final score

4. **Calculation**:
   ```
   exact_score = race_count_based_curve(exact_races)
   series_score = race_count_based_curve(series_total_races)  
   track_score = race_count_based_curve(track_total_races)
   final_score = (exact_score * 0.6) + (series_score * 0.25) + (track_score * 0.15)
   ```

**Race Count Curves**:
- Exact: 0→0, 1→30, 2-5→30-80, 6-10→80-100, 10+→100
- Series: 0→0, 1-3→20, 4-10→20-60, 11-20→60-90, 20+→90
- Track: 0→0, 1-3→15, 4-10→15-50, 11-20→50-80, 20+→80

**Example**: 2 exact races, 8 series races, 12 track races:
- Exact: 55 (2 races → 30 + (1/4)*50 = 42.5, rounded to 55)
- Series: 48 (8 races → 20 + (5/7)*40 = 48.6)  
- Track: 62 (12 races → 50 + (2/10)*30 = 56)
- Final: (55 * 0.6) + (48 * 0.25) + (62 * 0.15) = 54.3

### Factor 6: Fatigue Risk (0-100, lower = higher fatigue risk)

**Purpose**: Evaluates physical and mental fatigue based on race characteristics.

**Data Flow**:
1. **Race Length**: From `schedule_entries.race_length`
2. **Setup Type**: From `schedule_entries.has_open_setup`

3. **Calculation**:
   ```
   base_score = race_length <= 30 ? 90 :
                race_length <= 60 ? 70 :
                race_length <= 120 ? 50 : 30
   
   setup_penalty = has_open_setup ? 15 : 0
   final_score = clamp(base_score - setup_penalty, 0, 100)
   ```

**Example**: 90-minute race with open setup:
- Base score: 50 (long race)
- Setup penalty: 15
- Final score: 35

### Factor 7: Attrition Risk (0-100, lower = higher attrition rate)

**Purpose**: Predicts likelihood of race completion based on historical attrition.

**Data Flow**:
1. **Source**: Computed from `race_results` for series + track
   - Attrition rate = percentage of drivers who don't finish
   - Currently uses default 15% (placeholder for future implementation)

2. **Calculation**:
   ```
   normalized_attrition = clamp(attrition_rate, 0, 50)
   score = (1 - (normalized_attrition / 50)) * 100
   ```

**Example**: 20% attrition rate:
- Score = (1 - (20 / 50)) * 100 = 60

### Factor 8: Time Volatility (0-100, lower = higher volatility)

**Purpose**: Evaluates time-of-day and participation factors affecting race quality.

**Data Flow**:
1. **Time Slots**: Generated mock data (future: from iRacing API)
   - Hour of day (0-23 UTC)
   - Day of week (0-6, Sunday=0)
   - Participant count per slot

2. **Calculation** (per time slot):
   ```
   base_score = 100
   
   // Time penalties
   if (hour >= 22 || hour <= 6): base_score -= 30  // Late night
   if (hour >= 3 && hour <= 7): base_score -= 20   // Very early
   
   // Time bonuses  
   if (day == 5 && hour >= 18): base_score += 10    // Friday evening
   if (day == 6 || day == 0): base_score += 15      // Weekend
   
   // Participation penalty
   if (participants < 10): base_score -= 25
   
   slot_score = clamp(base_score, 0, 100)
   ```

3. **Final Score**: Average across all available time slots

**Example**: Saturday 2 PM with 25 participants:
- Base: 100
- Weekend bonus: +15
- Good participation: no penalty
- Final: 100 (clamped to 100)

## Mode-Specific Weighting

The algorithm supports three recommendation modes with different factor weights:

### Balanced Mode
```
performance: 15%, safety: 15%, consistency: 15%, predictability: 10%
familiarity: 15%, fatigueRisk: 10%, attritionRisk: 10%, timeVolatility: 10%
```

### iRating Push Mode  
```
performance: 25%, safety: 10%, consistency: 10%, predictability: 15%
familiarity: 20%, fatigueRisk: 5%, attritionRisk: 10%, timeVolatility: 5%
```

### Safety Recovery Mode
```
performance: 5%, safety: 30%, consistency: 20%, predictability: 15%
familiarity: 15%, fatigueRisk: 5%, attritionRisk: 5%, timeVolatility: 5%
```

## Risk Assessment

### iRating Risk
- **High**: Performance < 40 OR Predictability < 30
- **Medium**: Performance < 60 OR Predictability < 60  
- **Low**: Otherwise

### Safety Rating Risk
- **High**: Safety < 40 OR Attrition Risk < 30
- **Medium**: Safety < 60 OR Attrition Risk < 60
- **Low**: Otherwise

## Data Quality Handling

### Missing Data Fallbacks
1. **Insufficient Personal Data**: Use cross-series analysis with confidence weighting
2. **No Personal Data**: Use license-level defaults and global statistics
3. **NaN/Infinite Values**: Replace with conservative defaults
4. **Empty Global Stats**: Use predefined reasonable defaults

### Confidence Weighting
Personal data confidence increases with race count:
- 1-2 races: 30% confidence
- 3-4 races: 60% confidence  
- 5-9 races: 80% confidence
- 10+ races: 100% confidence

Low confidence scores are blended toward neutral (50) to reduce uncertainty.

## Performance Optimizations

### Caching Strategy
- Racing opportunities cached for 5 minutes
- Global stats batch-loaded to avoid N+1 queries
- Series/track combinations limited to 100 to prevent performance issues

### Database Indexes
- `idx_race_results_user_series`: User + series queries
- `idx_race_results_user_track`: User + track queries  
- `idx_race_results_date`: Time-based filtering
- `idx_race_results_season`: Season-based queries

This scoring system provides comprehensive race recommendations by analyzing multiple dimensions of racing data, from personal performance history to global participation patterns.

## Known Technical Issues

### Scoring Algorithm Edge Cases (Discovered January 2026)

**Issue**: Property-based testing revealed that the current scoring algorithm has fundamental edge cases where different inputs can produce identical outputs, particularly in the safety factor calculations.

**Root Causes**:
1. **Rounding and Clamping Logic**: The safety factor calculation uses rounding and clamping that can cause different incident rates to converge to the same final score
2. **Blending Algorithm Convergence**: The weighted blending of personal and global statistics can produce identical results for different input combinations
3. **NaN Handling**: Default fallback values for NaN/infinite inputs can mask differences between scenarios that should produce different scores

**Specific Examples**:
- Safety factors producing identical scores (e.g., 33) for different incident rates (e.g., 7.96 vs 2.5 incidents)
- Cross-series analysis producing identical safety scores (e.g., 79) for users with different overall incident rates
- License-based adjustments not differentiating between users with significantly different safety ratings

**Impact**:
- Reduces the algorithm's ability to differentiate between racing opportunities that should have different risk profiles
- May lead to suboptimal recommendations where genuinely safer or riskier options are scored identically
- Affects the accuracy of confidence indicators and priority scoring

**Recommended Future Improvements**:
1. **Increase Scoring Precision**: Use floating-point scores internally and only round for display
2. **Expand Scoring Ranges**: Increase the incident rate range from 0-8 to 0-12+ to better differentiate high-incident scenarios
3. **Improve Blending Logic**: Implement more sophisticated blending algorithms that preserve input differences
4. **Enhanced NaN Handling**: Use context-aware defaults rather than fixed fallback values
5. **Add Differentiation Penalties**: Ensure that edge cases with identical scores receive small differentiating adjustments

**Testing Notes**:
- Property-based tests successfully identified these issues through systematic input generation
- The familiarity threshold requirements (5+ races → 60+, 10+ races → 80+) are working correctly
- Confidence indicators and priority scoring features are functioning as designed

**Priority**: Medium - The algorithm produces reasonable recommendations overall, but these edge cases should be addressed in a future scoring algorithm refactor to improve differentiation accuracy.