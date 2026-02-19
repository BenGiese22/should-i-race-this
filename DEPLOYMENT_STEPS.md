# Deployment Steps for Race Time Filtering Fix

## Overview
This fix ensures that past races (e.g., 7 AM race when it's 8:38 AM) no longer appear in recommendations.

## Step-by-Step Deployment

### 1. Database Migration

Run the migration to add the new column:

```bash
# Option A: Using psql directly
psql -d your_database_name -f src/lib/db/migrations/add_race_time_descriptors.sql

# Option B: Using environment variable
psql $DATABASE_URL -f src/lib/db/migrations/add_race_time_descriptors.sql

# Option C: Copy and paste the SQL
# Open your database client and run:
ALTER TABLE schedule_entries 
ADD COLUMN IF NOT EXISTS race_time_descriptors JSONB;
```

Verify the column was added:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'schedule_entries' 
AND column_name = 'race_time_descriptors';
```

### 2. Deploy Code Changes

Deploy the updated code to your server. The changes are backward compatible, so the app will continue working even before the schedule re-sync.

### 3. Re-sync Schedules

Trigger a schedule sync to populate the new `race_time_descriptors` field:

```bash
# Option A: Via API endpoint (if you have one)
curl -X POST http://your-domain.com/api/admin/sync-schedules

# Option B: Via your admin interface
# Navigate to your admin panel and click "Sync Schedules"

# Option C: Run the sync script directly
npm run sync-schedules
# or
npx tsx scripts/sync-schedules.ts
```

### 4. Clear Cache (Optional)

The cache will auto-expire, but you can force a refresh:

```bash
# Via API endpoint
curl -X POST http://your-domain.com/api/admin/clear-cache

# Or restart your application
pm2 restart your-app
# or
systemctl restart your-service
```

### 5. Verify the Fix

#### Test 1: Check Debug Endpoint
```bash
# View next race times (adjust timezone as needed)
curl "http://your-domain.com/api/debug/next-race-times?timezone=America/Denver"
```

Look for:
- ✅ `upcomingRaces` count > 0
- ✅ `pastRaces` count should be 0 or low
- ✅ All `nextRaceTime` values are in the future

#### Test 2: Check Recommendations
```bash
# Get recommendations
curl "http://your-domain.com/api/recommendations"
```

Verify:
- ✅ No races with past times appear
- ✅ Top recommendation has a future race time

#### Test 3: Manual Verification
1. Note the current time in MST (or your timezone)
2. Check the top recommendation
3. Verify the next race time is in the future
4. Wait until a race time passes
5. Refresh recommendations
6. Verify that race no longer appears (or shows next occurrence)

### 6. Monitor

Watch for any issues in the first few hours:

```bash
# Check application logs
tail -f /var/log/your-app/error.log

# Monitor database queries
# Look for slow queries on schedule_entries table

# Check cache hit rates
# Verify recommendations are being cached properly
```

## Rollback Plan

If issues occur, you can rollback:

### 1. Revert Code
```bash
git revert <commit-hash>
git push
```

### 2. Keep Database Column
The new column doesn't break anything, so you can leave it:
```sql
-- Optional: Remove the column if needed
ALTER TABLE schedule_entries DROP COLUMN IF EXISTS race_time_descriptors;
```

## Testing in Development

Before deploying to production, test locally:

```bash
# 1. Run migration on dev database
psql -d dev_database -f src/lib/db/migrations/add_race_time_descriptors.sql

# 2. Start dev server
npm run dev

# 3. Run test script
npx tsx scripts/test-race-time-calculator.ts

# 4. Check debug endpoint
curl "http://localhost:3000/api/debug/next-race-times?timezone=America/Denver"

# 5. Test recommendations
curl "http://localhost:3000/api/recommendations"
```

## Common Issues & Solutions

### Issue: "Column already exists"
**Solution**: The migration uses `IF NOT EXISTS`, so this is safe to ignore.

### Issue: "race_time_descriptors is null for all entries"
**Solution**: Run the schedule sync to populate the data.

### Issue: "Still seeing past races"
**Solutions**:
1. Clear the cache
2. Verify schedule sync completed successfully
3. Check the debug endpoint to see calculated next race times
4. Verify server time is correct (should be UTC)

### Issue: "No races showing at all"
**Solutions**:
1. Check if schedule sync has run recently
2. Verify `weekStart` and `weekEnd` dates are current
3. Check if it's between race weeks (schedules change on Tuesdays)

## Performance Considerations

The changes are optimized for performance:
- ✅ JSONB column is efficient for querying
- ✅ Filtering happens in application layer (not database)
- ✅ Results are cached (default TTL applies)
- ✅ No additional database queries added

## Schedule Update Timing

Remember that iRacing updates schedules on Tuesdays around 3 PM ET:
- Old week races will automatically be filtered out
- New week races will appear after schedule sync
- Cache will refresh automatically based on TTL
- Consider running schedule sync shortly after 3 PM ET on Tuesdays

## Success Criteria

✅ No past races appear in recommendations
✅ Next race time is always in the future
✅ Debug endpoint shows correct calculations
✅ Performance remains good (no slow queries)
✅ Cache hit rate remains high
✅ No errors in application logs

## Support

If you encounter issues:
1. Check the debug endpoint first
2. Review application logs
3. Verify database migration completed
4. Check schedule sync status
5. Review the full documentation in `docs/RACE_TIME_FILTERING.md`
