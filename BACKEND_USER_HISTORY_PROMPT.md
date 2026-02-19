# Backend Task: Add User History to Recommendations API Response

## Context
The recommendations page frontend is ready to display user racing history (race count, average position delta, average incidents) for each recommended series/track combination. However, the backend API currently doesn't include this data in its response, causing the UI to show "0 races" for all recommendations.

The good news: The backend already fetches this data internally! The `recommendationEngine.getFilteredRecommendations()` method in `src/lib/recommendations/engine.ts` already calls `prepareUserHistory(userId)` and uses it for scoring. We just need to include it in the API response.

## Task Overview
Update the `/api/recommendations` endpoint to include user history data in its response so the frontend can display accurate racing statistics.

## Files to Modify

### 1. Type Definition: `src/lib/recommendations/types.ts`
**Location**: Line ~200-220 (RecommendationResponse interface)

**Current Structure**:
```typescript
export interface RecommendationResponse {
  recommendations: ScoredRecommendation[];
  userProfile: {
    primaryCategory: Category;
    licenseClasses: LicenseClass[];
    experienceSummary: ExperienceSummary;
  };
  metadata: {
    totalOpportunities: number;
    highConfidenceCount: number;
    estimatedCount: number;
    noDataCount: number;
    cacheStatus: 'hit' | 'miss';
    processingTimeMs?: number;
    cacheHitRate?: number;
  };
}
```

**Required Change**:
Add a `userHistory` field to the response:

```typescript
export interface RecommendationResponse {
  recommendations: ScoredRecommendation[];
  userProfile: {
    primaryCategory: Category;
    licenseClasses: LicenseClass[];
    experienceSummary: ExperienceSummary;
  };
  userHistory: UserHistory; // ADD THIS LINE
  metadata: {
    totalOpportunities: number;
    highConfidenceCount: number;
    estimatedCount: number;
    noDataCount: number;
    cacheStatus: 'hit' | 'miss';
    processingTimeMs?: number;
    cacheHitRate?: number;
  };
}
```

Note: The `UserHistory` interface is already defined in this file (line ~45):
```typescript
export interface UserHistory {
  userId: string;
  seriesTrackHistory: SeriesTrackHistory[];
  overallStats: UserOverallStats;
  licenseClasses: LicenseClass[];
}
```

### 2. Recommendation Engine: `src/lib/recommendations/engine.ts`
**Location**: Line ~58-130 (getFilteredRecommendations method)

**Current Code** (around line 120):
```typescript
return {
  recommendations: scoredRecommendations,
  userProfile: {
    primaryCategory: categoryAnalysis.primaryCategory,
    licenseClasses: userHistory.licenseClasses,
    experienceSummary
  },
  metadata
};
```

**Required Change**:
Include the `userHistory` in the return statement:

```typescript
return {
  recommendations: scoredRecommendations,
  userProfile: {
    primaryCategory: categoryAnalysis.primaryCategory,
    licenseClasses: userHistory.licenseClasses,
    experienceSummary
  },
  userHistory, // ADD THIS LINE - userHistory is already available in scope
  metadata
};
```

### 3. Frontend Update: `src/app/dashboard/recommendations/RecommendationsClient.tsx`
**Location**: Line ~340 (in the Primary recommendation rendering)

**Current Code**:
```typescript
<PrimaryRecommendationCard
  recommendation={transformToPrimaryRecommendation(
    primaryRecommendation,
    // TODO: Add seriesTrackHistory to API response
    undefined
  )}
  isProUser={isProUser}
/>
```

**Required Change**:
Replace `undefined` with the actual user history data:

```typescript
<PrimaryRecommendationCard
  recommendation={transformToPrimaryRecommendation(
    primaryRecommendation,
    data?.userHistory?.seriesTrackHistory
  )}
  isProUser={isProUser}
/>
```

## How It Works

### Data Flow:
1. **Backend fetches user history**: The `prepareUserHistory(userId)` function already retrieves all the user's racing history from the database
2. **Backend uses it for scoring**: The scoring algorithm uses this data to calculate recommendation scores
3. **Backend returns it**: Now we'll also include it in the API response
4. **Frontend receives it**: The `useRecommendations` hook will receive the data
5. **Frontend transforms it**: The `transformToPrimaryRecommendation` function looks up the specific series/track history
6. **Frontend displays it**: The `PrimaryRecommendationCard` shows the race count, position delta, and incidents

### Frontend Transformation Logic (Already Implemented):
The frontend has a `findUserHistory()` function that matches recommendations to user history:

```typescript
function findUserHistory(
  seriesId: number,
  trackId: number,
  userHistory?: SeriesTrackHistory[]
): SeriesTrackHistory | null {
  if (!userHistory) return null;
  return userHistory.find(h => h.seriesId === seriesId && h.trackId === trackId) || null;
}
```

This function is called in `transformToPrimaryRecommendation()` to populate:
- `userRaceCount`: Number of races completed in this series/track
- `avgPositionDelta`: Average position change (positive = gaining positions)
- `avgIncidents`: Average incidents per race

## Testing Checklist

After implementing these changes, verify:

1. **API Response Structure**:
   - Call `/api/recommendations` and verify the response includes `userHistory` field
   - Verify `userHistory.seriesTrackHistory` is an array
   - Verify each item has `seriesId`, `trackId`, `raceCount`, `avgPositionDelta`, `avgIncidents`

2. **Frontend Display**:
   - Navigate to `/dashboard/recommendations`
   - Check "Your History in This Series" section shows actual race counts (not 0)
   - Verify position delta shows positive/negative values based on performance
   - Verify incident counts reflect actual data
   - Confirm "Limited History" badge appears when race count < 5

3. **Edge Cases**:
   - User with no history in a recommended series should show 0 races (graceful fallback)
   - User with history should see accurate stats
   - Multiple recommendations should each show their specific history

## Example Expected Output

**API Response** (after changes):
```json
{
  "recommendations": [...],
  "userProfile": {
    "primaryCategory": "sports_car",
    "licenseClasses": [...],
    "experienceSummary": {...}
  },
  "userHistory": {
    "userId": "user-123",
    "seriesTrackHistory": [
      {
        "seriesId": 456,
        "trackId": 789,
        "raceCount": 12,
        "avgStartingPosition": 8.5,
        "avgFinishingPosition": 6.2,
        "avgPositionDelta": 2.3,
        "avgIncidents": 1.8,
        "finishPositionStdDev": 3.1,
        "lastRaceDate": "2024-02-10T..."
      }
    ],
    "overallStats": {...},
    "licenseClasses": [...]
  },
  "metadata": {...}
}
```

**Frontend Display** (after changes):
```
Your History in This Series
┌─────────────────────────────────────────────┐
│ Races Completed: 12                         │
│ Position Change: +2.3 (avg per race)        │
│ Incidents: 1.8x (avg per race)              │
└─────────────────────────────────────────────┘
Based on 12 races you've completed in this series.
```

## Summary

This is a straightforward change that requires:
1. Adding one field to the TypeScript interface
2. Including one variable in the return statement (it's already in scope!)
3. Updating one line in the frontend to use the data instead of `undefined`

The data is already being fetched and used internally - we're just exposing it to the frontend so users can see their actual racing history.
