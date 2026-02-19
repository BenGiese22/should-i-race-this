# Race Time Filtering Fix - Quick Summary

## What Was Fixed

Past races (e.g., 7 AM race showing at 8:38 AM) are now properly filtered out from recommendations.

## Changes Made

### 1. Database Schema (`src/lib/db/schema.ts`)
- Added `raceTimeDescriptors` JSON column to store race timing data from iRacing API

### 2. New Module (`src/lib/iracing/race-time-calculator.ts`)
- `calculateNextRaceTime()` - Finds next upcoming race for a series
- `generateTimeSlots()` - Creates time slot list from race descriptors
- Handles both repeating races (every X minutes) and fixed session times

### 3. Schedule Sync (`src/lib/iracing/schedule.ts`)
- Now stores `race_time_descriptors` from iRacing API in database

### 4. Recommendation Engine (`src/lib/recommendations/data-preparation.ts`)
- Filters out series with no upcoming races
- Uses real race times instead of mock data
- Only shows races that haven't started yet

### 5. Debug Endpoint (`src/app/api/debug/next-race-times/route.ts`)
- View next race times for all series
- Check which races are filtered out
- Verify timezone conversions

### 6. Migration (`src/lib/db/migrations/add_race_time_descriptors.sql`)
- SQL script to add new column to existing database

## How to Deploy

1. **Run database migration**:
   ```bash
   # Connect to your database and run:
   psql -d your_database -f src/lib/db/migrations/add_race_time_descriptors.sql
   ```

2. **Re-sync schedules** to populate the new field:
   - The next schedule sync will automatically populate `race_time_descriptors`
   - Or manually trigger: `POST /api/admin/sync-schedules`

3. **Clear cache** (optional, will auto-expire):
   ```typescript
   import { clearOpportunitiesCache } from '@/lib/recommendations/data-preparation';
   clearOpportunitiesCache();
   ```

## Testing

### Check if it's working:
```bash
# View next race times (adjust timezone as needed)
curl "http://localhost:3000/api/debug/next-race-times?timezone=America/Denver"
```

### What to verify:
- ✅ No races with past times appear in recommendations
- ✅ Next race time is always in the future
- ✅ Races update correctly when schedule changes (Tuesday 3 PM)
- ✅ Time slots show real race times, not mock data

## Key Features

### Handles Repeating Races
Example: Mazda MX-5 races every 30 minutes
- Calculates exact next race time based on current time
- Accounts for day of week restrictions

### Handles Fixed Session Times
Example: Special events with specific times
- Filters out past sessions
- Shows only upcoming sessions

### Timezone Aware
- All calculations in UTC (iRacing standard)
- Debug endpoint shows times in your timezone
- Ready for user timezone preferences

### Schedule Updates
- Automatically handles Tuesday schedule changes
- Week-based filtering ensures old weeks are excluded
- New races appear once schedule syncs

## Backward Compatibility

- Works with existing data (treats null descriptors as valid)
- Falls back to mock time slots if no real data available
- No breaking changes to existing API

## Next Steps (Optional Enhancements)

1. Add user timezone preference storage
2. Fetch real strength-of-field data per session
3. Add race start notifications/reminders
4. Display multiple upcoming race times per series
5. Show countdown to next race

## Files Modified

- `src/lib/db/schema.ts` - Added column
- `src/lib/iracing/schedule.ts` - Store race times
- `src/lib/recommendations/data-preparation.ts` - Filter past races
- `src/lib/iracing/race-time-calculator.ts` - NEW: Time calculations
- `src/app/api/debug/next-race-times/route.ts` - NEW: Debug endpoint
- `src/lib/db/migrations/add_race_time_descriptors.sql` - NEW: Migration
- `docs/RACE_TIME_FILTERING.md` - NEW: Full documentation

## Support

If races still show in the past after deployment:
1. Check debug endpoint to see calculated next race times
2. Verify `race_time_descriptors` is populated in database
3. Clear recommendation cache
4. Check server time is correct (should be UTC)
