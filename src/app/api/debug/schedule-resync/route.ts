/**
 * Debug endpoint to clear schedule data and re-sync
 *
 * This endpoint:
 * 1. Clears all existing schedule_entries
 * 2. Runs a fresh sync with the fixed extraction logic
 * 3. Returns sample data for verification
 *
 * POST /api/debug/schedule-resync
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { db, scheduleEntries } from '@/lib/db';
import { syncScheduleData } from '@/lib/iracing/schedule';
import { getCurrentSeason } from '@/lib/iracing/client';
import { sql } from 'drizzle-orm';

export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentSeason = getCurrentSeason();
    const results: any = {
      currentSeason,
      steps: [],
      verification: {},
    };

    // Step 1: Count existing entries before clearing
    const countBefore = await db.execute(
      sql`SELECT COUNT(*) as count FROM schedule_entries`
    );
    const existingCount = parseInt(countBefore.rows[0]?.count as string) || 0;
    results.steps.push({
      step: 1,
      action: 'Count existing entries',
      result: `Found ${existingCount} existing schedule entries`,
    });

    // Step 2: Clear all schedule entries
    await db.delete(scheduleEntries);
    results.steps.push({
      step: 2,
      action: 'Clear schedule_entries table',
      result: `Deleted ${existingCount} entries`,
    });

    // Step 3: Run fresh sync
    const syncResult = await syncScheduleData(
      session.userId,
      currentSeason.year,
      currentSeason.quarter
    );
    results.steps.push({
      step: 3,
      action: 'Run syncScheduleData',
      result: syncResult.success
        ? `Added ${syncResult.entriesAdded} new entries`
        : `Sync failed: ${syncResult.error}`,
      success: syncResult.success,
      entriesAdded: syncResult.entriesAdded,
    });

    if (!syncResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Sync failed',
        ...results,
      }, { status: 500 });
    }

    // Step 4: Get verification data
    // Sample entries by category
    const categorySample = await db.execute(
      sql`SELECT category, COUNT(*) as count FROM schedule_entries GROUP BY category ORDER BY count DESC`
    );
    results.verification.categoryDistribution = categorySample.rows;

    // Sample entries by license
    const licenseSample = await db.execute(
      sql`SELECT license_required, COUNT(*) as count FROM schedule_entries GROUP BY license_required ORDER BY count DESC`
    );
    results.verification.licenseDistribution = licenseSample.rows;

    // Sample entries by setup type
    const setupSample = await db.execute(
      sql`SELECT has_open_setup, COUNT(*) as count FROM schedule_entries GROUP BY has_open_setup`
    );
    results.verification.setupDistribution = setupSample.rows;

    // Get actual sample entries (10 entries from different categories)
    const sampleEntries = await db.execute(
      sql`
        SELECT
          series_id,
          series_name,
          track_name,
          license_required,
          category,
          has_open_setup,
          race_week_num,
          season_year,
          season_quarter
        FROM schedule_entries
        ORDER BY series_name, race_week_num
        LIMIT 20
      `
    );
    results.verification.sampleEntries = sampleEntries.rows;

    // Count by category for detailed analysis
    const detailedAnalysis = await db.execute(
      sql`
        SELECT
          category,
          license_required,
          COUNT(*) as count,
          COUNT(CASE WHEN has_open_setup = true THEN 1 END) as open_setup_count,
          COUNT(CASE WHEN has_open_setup = false THEN 1 END) as fixed_setup_count
        FROM schedule_entries
        GROUP BY category, license_required
        ORDER BY category, license_required
      `
    );
    results.verification.detailedAnalysis = detailedAnalysis.rows;

    results.steps.push({
      step: 4,
      action: 'Gather verification data',
      result: 'Verification data collected',
    });

    // Step 5: Validation checks
    const validationIssues: string[] = [];

    // Check for legacy "road" category
    const roadCount = categorySample.rows.find((r: any) => r.category === 'road');
    if (roadCount && parseInt(roadCount.count) > 0) {
      validationIssues.push(`WARNING: Found ${roadCount.count} entries with legacy "road" category`);
    }

    // Check if only "Rookie" license exists (might indicate extraction failure)
    const nonRookieLicenses = licenseSample.rows.filter((r: any) =>
      r.license_required !== 'Rookie' && r.license_required !== 'rookie'
    );
    if (nonRookieLicenses.length === 0 && syncResult.entriesAdded > 0) {
      validationIssues.push('WARNING: All entries have Rookie license - extraction may be failing');
    }

    // Check setup distribution
    const hasOpenSetup = setupSample.rows.find((r: any) => r.has_open_setup === true);
    const hasFixedSetup = setupSample.rows.find((r: any) => r.has_open_setup === false);
    if (!hasFixedSetup && syncResult.entriesAdded > 0) {
      validationIssues.push('WARNING: No fixed setup entries found - all series appear as open setup');
    }

    results.validation = {
      issues: validationIssues,
      passed: validationIssues.length === 0,
    };

    return NextResponse.json({
      success: true,
      message: validationIssues.length === 0
        ? 'Schedule re-sync completed successfully with no issues detected'
        : `Schedule re-sync completed with ${validationIssues.length} potential issue(s)`,
      ...results,
    });

  } catch (error) {
    console.error('Schedule resync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resync schedule data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to preview current state without making changes
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentSeason = getCurrentSeason();

    // Get current state
    const totalCount = await db.execute(
      sql`SELECT COUNT(*) as count FROM schedule_entries`
    );

    const categorySample = await db.execute(
      sql`SELECT category, COUNT(*) as count FROM schedule_entries GROUP BY category ORDER BY count DESC`
    );

    const licenseSample = await db.execute(
      sql`SELECT license_required, COUNT(*) as count FROM schedule_entries GROUP BY license_required ORDER BY count DESC`
    );

    const setupSample = await db.execute(
      sql`SELECT has_open_setup, COUNT(*) as count FROM schedule_entries GROUP BY has_open_setup`
    );

    const sampleEntries = await db.execute(
      sql`
        SELECT
          series_name,
          track_name,
          license_required,
          category,
          has_open_setup
        FROM schedule_entries
        LIMIT 10
      `
    );

    return NextResponse.json({
      success: true,
      message: 'Current schedule data state (use POST to resync)',
      currentSeason,
      totalEntries: parseInt(totalCount.rows[0]?.count as string) || 0,
      categoryDistribution: categorySample.rows,
      licenseDistribution: licenseSample.rows,
      setupDistribution: setupSample.rows,
      sampleEntries: sampleEntries.rows,
    });

  } catch (error) {
    console.error('Schedule state check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check schedule state',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
