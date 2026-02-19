# Race Time Filtering Fix - Deployment Checklist

## Pre-Deployment

- [ ] Review all code changes
- [ ] Run TypeScript compiler to check for errors: `npm run build` or `tsc --noEmit`
- [ ] Test locally with dev database
- [ ] Run test script: `npx tsx scripts/test-race-time-calculator.ts`
- [ ] Verify debug endpoint works locally: `http://localhost:3000/api/debug/next-race-times?timezone=America/Denver`
- [ ] Check recommendations locally: `http://localhost:3000/api/recommendations`

## Deployment

- [ ] **Step 1**: Run database migration
  ```bash
  psql $DATABASE_URL -f src/lib/db/migrations/add_race_time_descriptors.sql
  ```

- [ ] **Step 2**: Verify column was added
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'schedule_entries' AND column_name = 'race_time_descriptors';
  ```

- [ ] **Step 3**: Deploy code to production
  - Commit changes
  - Push to repository
  - Deploy via your CI/CD pipeline or manual deployment

- [ ] **Step 4**: Re-sync schedules to populate new field
  - Via API: `POST /api/admin/sync-schedules`
  - Or via admin interface
  - Or via script: `npm run sync-schedules`

- [ ] **Step 5**: Clear cache (optional, will auto-expire)
  - Via API: `POST /api/admin/clear-cache`
  - Or restart application

## Post-Deployment Verification

- [ ] **Test 1**: Check debug endpoint
  ```bash
  curl "https://your-domain.com/api/debug/next-race-times?timezone=America/Denver"
  ```
  - Verify `upcomingRaces` > 0
  - Verify `pastRaces` is 0 or low
  - Verify all `nextRaceTime` values are in the future

- [ ] **Test 2**: Check recommendations API
  ```bash
  curl "https://your-domain.com/api/recommendations"
  ```
  - Verify no past races appear
  - Verify top recommendation has future race time

- [ ] **Test 3**: Manual UI test
  - Open the app in browser
  - Note current time
  - Check top recommendation
  - Verify race time is in the future

- [ ] **Test 4**: Wait for a race to pass
  - Note a race time that's coming up soon
  - Wait for that time to pass
  - Refresh recommendations
  - Verify that race no longer appears (or shows next occurrence)

## Monitoring (First 24 Hours)

- [ ] Check application logs for errors
- [ ] Monitor database performance
- [ ] Verify cache hit rates remain good
- [ ] Check user feedback/reports
- [ ] Monitor API response times

## Known Good State Indicators

✅ Debug endpoint shows:
- `upcomingRaces` count matches expected series count
- `pastRaces` count is 0 or very low
- All `nextRaceTime` values are in the future
- `seriesWithoutTimeDescriptors` decreases after schedule sync

✅ Recommendations show:
- Only races with future times
- Correct next race time for each series
- No "7 AM race at 8:38 AM" type issues

✅ Performance:
- API response times < 500ms
- Cache hit rate > 80%
- No slow database queries

## Rollback Procedure (If Needed)

- [ ] Revert code deployment
  ```bash
  git revert <commit-hash>
  git push
  # Redeploy
  ```

- [ ] (Optional) Remove database column
  ```sql
  ALTER TABLE schedule_entries DROP COLUMN IF EXISTS race_time_descriptors;
  ```

- [ ] Clear cache
- [ ] Verify old behavior is restored

## Files Changed (For Reference)

### Modified Files:
- `src/lib/db/schema.ts` - Added raceTimeDescriptors column
- `src/lib/iracing/schedule.ts` - Store race time descriptors
- `src/lib/recommendations/data-preparation.ts` - Filter past races

### New Files:
- `src/lib/iracing/race-time-calculator.ts` - Time calculation logic
- `src/app/api/debug/next-race-times/route.ts` - Debug endpoint
- `src/lib/db/migrations/add_race_time_descriptors.sql` - Migration
- `docs/RACE_TIME_FILTERING.md` - Full documentation
- `scripts/test-race-time-calculator.ts` - Test script
- `RACE_TIME_FIX_SUMMARY.md` - Quick reference
- `DEPLOYMENT_STEPS.md` - Detailed deployment guide
- `RACE_TIME_FIX_CHECKLIST.md` - This file

## Success Criteria

✅ **Primary Goal**: No past races appear in recommendations
✅ **Secondary Goal**: Next race time is always accurate
✅ **Performance**: No degradation in response times
✅ **Reliability**: No errors in logs
✅ **User Experience**: Recommendations are more relevant

## Notes

- The fix is backward compatible - works with old data
- Schedule updates happen Tuesdays ~3 PM ET
- All times are calculated in UTC, displayed in user timezone
- Cache TTL ensures stale data is refreshed automatically

## Questions to Answer

- [ ] Are past races still appearing? → Check debug endpoint
- [ ] Are race times accurate? → Compare with iRacing schedule
- [ ] Is performance good? → Check API response times
- [ ] Are users happy? → Monitor feedback

## Completion

- [ ] All tests passed
- [ ] No errors in logs
- [ ] Performance is good
- [ ] Users report correct behavior
- [ ] Documentation is updated
- [ ] Team is informed of changes

---

**Date Deployed**: _______________
**Deployed By**: _______________
**Production URL**: _______________
**Issues Encountered**: _______________
**Resolution**: _______________
