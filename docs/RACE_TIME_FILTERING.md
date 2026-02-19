# Race Time Filtering Implementation

## Problem Statement

The recommendation system was showing races that had already started or passed. For example, at 8:38 AM MST, a race scheduled for 7:00 AM was still appearing as the top recommendation.

### Root Causes

1. **Database schema limitation**: The `schedule_entries` table only stored `weekStart` and `weekEnd` as DATE types (no time component)
2. **No time-based filtering**: The query only checked if the current date fell within the race week, not if individual race times had passed
3. **Mock time slots**: The `timeSlots` field contained generated mock data instead of real race times from iRacing
4. **Missing timezone handling**: No conversion between UTC (iRacing's timezone) and user timezones (e.g., MST)

## Solution Overview

### 1. Database Schema Update

Added `race_time_descriptors` JSONB column to `schedule_entries` table to store the complete race timing information from iRacing API:

```sql
ALTER TABLE schedule_entries 
ADD COLUMN race_time_descriptors JSONB;
```

This column stores the `race_time_descriptors` array from iRacing API, which contains:
- `repeating`: Boolean indicating if races repeat
- `session_times`: Array of ISO timestamps for fixed races
- `first_session_time`: Time of day for first session (HH:MM:SS)
- `repeat_minutes`: Interval between races (e.g., 30 for every 30 minutes)
- `day_offset`: Array of days when races occur (0=Sunday, 6=Saturday)
- `session_minutes`: Race length in minutes

### 2. Race Time Calculator Module

Created `src/lib/iracing/race-time-calculator.ts` with functions to:

- **`calculateNextRaceTime()`**: Determines the next upcoming race time for a series
  - Handles both repeating races (e.g., every 30 minutes) and fixed session times
  - Returns null if no upcoming races exist
  
- **`generateTimeSlots()`**: Generates a list of race times for the next week
  - Used to populate the `timeSlots` field with real data instead of mock data

### 3. Schedule Sync Update

Modified `src/lib/iracing/schedule.ts` to store `race_time_descriptors` when syncing schedules:

```typescript
const dbEntry = {
  // ... other fields
  raceTimeDescriptors: scheduleEntry.race_time_descriptors || null,
};
```

### 4. Recommendation Filtering

Updated `src/lib/recommendations/data-preparation.ts` to:

1. Filter out schedule entries with no upcoming races:
```typescript
const validScheduleResults = scheduleResults.filter(entry => {
  if (!entry.raceTimeDescriptors) return true; // Backward compatibility
  
  const nextRace = calculateNextRaceTime(
    entry.raceTimeDescriptors as RaceTimeDescriptor[],
    currentDate
  );
  
  return nextRace !== null; // Only include if there's an upcoming race
});
```

2. Generate real time slots from `race_time_descriptors` instead of mock data

## How It Works

### Repeating Races Example

For a series that races every 30 minutes starting at 00:15:00 UTC:

```json
{
  "repeating": true,
  "first_session_time": "00:15:00",
  "repeat_minutes": 30,
  "day_offset": [0, 1, 2, 3, 4, 5, 6]
}
```

If current time is 8:38 AM MST (15:38 UTC):
1. Calculate minutes since midnight UTC: 15 * 60 + 38 = 938 minutes
2. Calculate minutes since first session: 938 - 15 = 923 minutes
3. Calculate intervals passed: floor(923 / 30) = 30 intervals
4. Next race minute: 15 + (30 + 1) * 30 = 945 minutes = 15:45 UTC
5. Next race time: Today at 15:45 UTC (8:45 AM MST)

### Fixed Session Times Example

For a series with specific race times:

```json
{
  "repeating": false,
  "session_times": [
    "2025-11-12T01:00:00Z",
    "2025-11-13T01:00:00Z",
    "2025-11-14T01:00:00Z"
  ]
}
```

The calculator filters out past times and returns the earliest future time.

## Schedule Updates

iRacing typically updates schedules on Tuesdays around 3 PM ET (20:00 UTC). The system handles this by:

1. **Week-based filtering**: Queries only include races where `weekStart <= currentDate <= weekEnd`
2. **Time-based filtering**: Within the current week, only races with future times are included
3. **Cache invalidation**: The cache TTL ensures stale data is refreshed regularly

When a new week starts:
- Old races are automatically excluded by the week date filter
- New races are included once the schedule sync runs
- The `clearOpportunitiesCache()` function can be called to force immediate refresh

## Testing & Debugging

### Debug Endpoint

Access `/api/debug/next-race-times?timezone=America/Denver` to see:
- Current time in UTC and local timezone
- Next race time for each series
- Which races have passed
- Series without race time descriptors

### Manual Testing

1. Check current recommendations: `/api/recommendations`
2. Verify no past races appear
3. Check debug endpoint to see next race times
4. Compare with current time in your timezone

## Migration Steps

1. **Run database migration**:
   ```bash
   psql -d your_database -f src/lib/db/migrations/add_race_time_descriptors.sql
   ```

2. **Re-sync schedules** to populate `race_time_descriptors`:
   ```bash
   # Call the schedule sync endpoint or run sync script
   curl -X POST http://localhost:3000/api/admin/sync-schedules
   ```

3. **Clear cache** to ensure fresh data:
   ```typescript
   import { clearOpportunitiesCache } from '@/lib/recommendations/data-preparation';
   clearOpportunitiesCache();
   ```

4. **Verify** using the debug endpoint

## Backward Compatibility

The system maintains backward compatibility:
- If `race_time_descriptors` is null, the entry is included (old data)
- Mock time slots are used as fallback if no descriptors exist
- Existing functionality continues to work during migration

## Future Enhancements

1. **Real-time SOF data**: Replace mock strength-of-field values with actual session data
2. **User timezone preferences**: Store and use user's preferred timezone
3. **Race reminders**: Notify users before their recommended races start
4. **Historical accuracy**: Track prediction accuracy for race times
5. **Multi-timezone display**: Show race times in multiple timezones simultaneously
