# Race Time Filtering - Visual Flow Diagram

## Problem: Past Races Showing in Recommendations

```
Current Time: 8:38 AM MST (15:38 UTC)

OLD BEHAVIOR (BROKEN):
┌─────────────────────────────────────────────────────────────┐
│ Database Query                                              │
│ WHERE weekStart <= '2026-02-11' AND weekEnd >= '2026-02-11'│
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Returns ALL races for the week (no time filtering)         │
│ - 7:00 AM race ❌ (PAST)                                    │
│ - 9:00 AM race ✅ (FUTURE)                                  │
│ - 1:00 PM race ✅ (FUTURE)                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Recommendation Engine                                       │
│ Scores all races (including past ones)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ RESULT: 7:00 AM race shows as top recommendation ❌        │
└─────────────────────────────────────────────────────────────┘
```

## Solution: Filter by Actual Race Times

```
Current Time: 8:38 AM MST (15:38 UTC)

NEW BEHAVIOR (FIXED):
┌─────────────────────────────────────────────────────────────┐
│ Database Query                                              │
│ WHERE weekStart <= '2026-02-11' AND weekEnd >= '2026-02-11'│
│ (Same as before)                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ For each race, check race_time_descriptors:                │
│                                                             │
│ Race A: {repeating: true, first_session: "14:00:00", ...}  │
│   → calculateNextRaceTime() → Tomorrow 7:00 AM ✅          │
│                                                             │
│ Race B: {repeating: true, first_session: "16:00:00", ...}  │
│   → calculateNextRaceTime() → Today 9:00 AM ✅             │
│                                                             │
│ Race C: {session_times: ["2026-02-11T14:00:00Z", ...]}     │
│   → calculateNextRaceTime() → null ❌ (all times past)     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Filter: Keep only races with nextRaceTime !== null         │
│ - Race A: Tomorrow 7:00 AM ✅                               │
│ - Race B: Today 9:00 AM ✅                                  │
│ - Race C: (filtered out) ❌                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Recommendation Engine                                       │
│ Scores only races with future times                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ RESULT: Only future races in recommendations ✅             │
└─────────────────────────────────────────────────────────────┘
```

## Race Time Calculation Logic

### Repeating Races (e.g., every 30 minutes)

```
Input: {
  repeating: true,
  first_session_time: "00:15:00",  // 00:15 UTC
  repeat_minutes: 30,
  day_offset: [0,1,2,3,4,5,6]      // All days
}

Current Time: 15:38 UTC (8:38 AM MST)

Calculation:
1. Current minute of day: 15*60 + 38 = 938 minutes
2. First session minute: 0*60 + 15 = 15 minutes
3. Minutes since first: 938 - 15 = 923 minutes
4. Intervals passed: floor(923 / 30) = 30 intervals
5. Next interval: 30 + 1 = 31
6. Next race minute: 15 + (31 * 30) = 945 minutes
7. Convert: 945 / 60 = 15 hours, 45 minutes
8. Next race: Today at 15:45 UTC (8:45 AM MST) ✅

Result: 7 minutes from now
```

### Fixed Session Times

```
Input: {
  repeating: false,
  session_times: [
    "2026-02-11T14:00:00Z",  // 7:00 AM MST - PAST
    "2026-02-11T20:00:00Z",  // 1:00 PM MST - FUTURE
    "2026-02-12T01:00:00Z"   // 6:00 PM MST - FUTURE
  ]
}

Current Time: 15:38 UTC (8:38 AM MST)

Calculation:
1. Filter times > current time
   - 14:00 UTC ❌ (past)
   - 20:00 UTC ✅ (future)
   - 01:00 UTC next day ✅ (future)
2. Sort by time
3. Return earliest: 20:00 UTC (1:00 PM MST)

Result: 4 hours 22 minutes from now
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ iRacing API                                                 │
│ /data/series/seasons                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
                  race_time_descriptors
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Schedule Sync (src/lib/iracing/schedule.ts)                │
│ - Fetches season data                                       │
│ - Extracts race_time_descriptors                           │
│ - Stores in database                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Database (schedule_entries table)                          │
│ - seriesId, trackId, etc.                                   │
│ - race_time_descriptors (JSONB) ← NEW                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Data Preparation (src/lib/recommendations/...)             │
│ - Queries current week's races                             │
│ - Calls calculateNextRaceTime() for each                   │
│ - Filters out races with no future times                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Race Time Calculator (src/lib/iracing/...)                 │
│ - Parses race_time_descriptors                             │
│ - Calculates next race time                                │
│ - Returns null if all times are past                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Recommendation Engine                                       │
│ - Scores only races with future times                      │
│ - Returns sorted recommendations                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ API Response (/api/recommendations)                        │
│ - Only future races ✅                                      │
└─────────────────────────────────────────────────────────────┘
```

## Timeline Example

```
Tuesday 3:00 PM ET - iRacing updates schedules
    ↓
Tuesday 3:05 PM ET - Schedule sync runs
    ↓
    Database updated with new race_time_descriptors
    ↓
Tuesday 3:06 PM ET - User requests recommendations
    ↓
    Cache miss (new data)
    ↓
    Query database for current week
    ↓
    Calculate next race time for each series
    ↓
    Filter out past races
    ↓
    Score and sort remaining races
    ↓
    Cache result
    ↓
    Return to user ✅

Wednesday 8:38 AM MST - User requests recommendations
    ↓
    Cache hit (if within TTL)
    ↓
    Return cached result ✅
    
    OR
    
    Cache miss (expired)
    ↓
    Re-calculate with current time
    ↓
    7:00 AM race is now in the past
    ↓
    calculateNextRaceTime() returns tomorrow's 7:00 AM
    ↓
    Race still appears but with tomorrow's time ✅
```

## Key Components

### 1. Database Schema
```typescript
scheduleEntries = {
  // ... existing fields
  raceTimeDescriptors: json('race_time_descriptors')  // NEW
}
```

### 2. Race Time Calculator
```typescript
calculateNextRaceTime(
  descriptors: RaceTimeDescriptor[],
  currentTime: Date
): NextRaceTime | null
```

### 3. Data Preparation Filter
```typescript
const validScheduleResults = scheduleResults.filter(entry => {
  const nextRace = calculateNextRaceTime(
    entry.raceTimeDescriptors,
    currentDate
  );
  return nextRace !== null;  // Only keep races with future times
});
```

## Benefits

✅ **Accurate**: Shows only races that haven't started
✅ **Real-time**: Updates as time passes
✅ **Efficient**: Filtering happens in application layer
✅ **Flexible**: Handles both repeating and fixed races
✅ **Timezone-aware**: Calculates in UTC, displays in user timezone
✅ **Backward compatible**: Works with old data (null descriptors)

## Edge Cases Handled

1. **Race just passed**: Next occurrence is calculated
2. **No more races this week**: Race is filtered out
3. **Multiple descriptors**: Earliest next race is used
4. **Day-of-week restrictions**: Only valid days are considered
5. **Midnight rollover**: Correctly handles day boundaries
6. **Schedule updates**: New data replaces old automatically
