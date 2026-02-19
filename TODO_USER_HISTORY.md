# TODO: User History Data Integration

## Issue
The recommendations page currently shows "0 races" for user history because the API response doesn't include the user's series/track history data.

## What's Needed

### Backend Changes
The `/api/recommendations` endpoint needs to include user history data in its response.

**Current Response Structure:**
```typescript
{
  recommendations: ScoredRecommendation[];
  userProfile: {
    primaryCategory: Category;
    licenseClasses: LicenseClass[];
    experienceSummary: ExperienceSummary;
  };
  metadata: { ... };
}
```

**Required Addition:**
```typescript
{
  recommendations: ScoredRecommendation[];
  userProfile: {
    primaryCategory: Category;
    licenseClasses: LicenseClass[];
    experienceSummary: ExperienceSummary;
  };
  userHistory: {
    userId: string;
    seriesTrackHistory: SeriesTrackHistory[];
    overallStats: UserOverallStats;
    licenseClasses: LicenseClass[];
  };
  metadata: { ... };
}
```

### Frontend Changes (Already Prepared)
The frontend code in `src/app/dashboard/recommendations/RecommendationsClient.tsx` is already set up to:
1. Accept `seriesTrackHistory` in the transformation function
2. Look up user history for each recommendation by matching `seriesId` and `trackId`
3. Display the actual race count, position delta, and incidents when available
4. Fall back to 0 values when no history is found

### Files to Update
1. **Backend API**: `/api/recommendations` endpoint
2. **Type Definition**: `src/lib/recommendations/types.ts` - Update `RecommendationResponse` interface
3. **Frontend**: Uncomment the line in `RecommendationsClient.tsx` that passes user history (currently marked with TODO)

### Testing
Once implemented, verify:
- User history shows correct race counts for series they've raced
- Position delta shows positive/negative values based on actual performance
- Incident counts reflect actual user data
- Limited history badge appears when race count < 5
