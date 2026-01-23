/**
 * Debug endpoint to inspect the raw iRacing API response structure
 * for schedule data. This helps identify where license_group, category,
 * and fixed_setup fields are located in the API response.
 *
 * GET /api/debug/schedule-api-structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { makeAuthenticatedRequest, getCurrentSeason } from '@/lib/iracing/client';

// Fields we specifically want to track
const LICENSE_FIELDS = [
  'license_group',
  'license_group_id',
  'min_license_level',
  'license_level',
  'license',
  'min_sr',
  'min_license',
];

const CATEGORY_FIELDS = [
  'category',
  'category_id',
  'track_type',
  'series_type',
];

const SETUP_FIELDS = [
  'fixed_setup',
  'open_setup',
  'is_fixed_setup',
  'is_open_setup',
  'setup_type',
];

function extractRelevantFields(obj: any, fieldNames: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const field of fieldNames) {
    if (obj && obj[field] !== undefined) {
      result[field] = obj[field];
    }
  }
  return result;
}

function getAllKeys(obj: any): string[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.keys(obj);
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentSeason = getCurrentSeason();
    const results: any = {
      currentSeason,
      apiResponses: {},
      fieldAnalysis: {
        licenseFields: {},
        categoryFields: {},
        setupFields: {},
      },
      recommendations: [],
    };

    // Fetch seasons data from the API
    let seasonsData: any[] = [];
    try {
      const seasonsResponse = await makeAuthenticatedRequest(
        session.userId,
        '/series/seasons',
        {
          season_year: currentSeason.year,
          season_quarter: currentSeason.quarter,
          include_series: 1,
        }
      );

      if (Array.isArray(seasonsResponse)) {
        seasonsData = seasonsResponse;
      }

      results.apiResponses.seasonsEndpoint = {
        success: true,
        totalSeasons: seasonsData.length,
      };
    } catch (error) {
      results.apiResponses.seasonsEndpoint = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      return NextResponse.json(results);
    }

    // Analyze a sample of seasons (take first 5 for variety)
    const sampleSeasons = seasonsData.slice(0, 5);
    results.sampleSeasons = [];

    for (const season of sampleSeasons) {
      const seasonAnalysis: any = {
        season_id: season.season_id,
        series_id: season.series_id,
        season_name: season.season_name || season.season_short_name,

        // All keys available on this season object
        allAvailableKeys: getAllKeys(season),

        // Extract specific field groups
        licenseFields: extractRelevantFields(season, LICENSE_FIELDS),
        categoryFields: extractRelevantFields(season, CATEGORY_FIELDS),
        setupFields: extractRelevantFields(season, SETUP_FIELDS),

        // Track fields found
        licenseFieldsFound: LICENSE_FIELDS.filter(f => season[f] !== undefined),
        categoryFieldsFound: CATEGORY_FIELDS.filter(f => season[f] !== undefined),
        setupFieldsFound: SETUP_FIELDS.filter(f => season[f] !== undefined),
      };

      // Analyze first schedule entry if available
      if (season.schedules && Array.isArray(season.schedules) && season.schedules.length > 0) {
        const firstSchedule = season.schedules[0];
        seasonAnalysis.sampleScheduleEntry = {
          allAvailableKeys: getAllKeys(firstSchedule),
          licenseFields: extractRelevantFields(firstSchedule, LICENSE_FIELDS),
          categoryFields: extractRelevantFields(firstSchedule, CATEGORY_FIELDS),
          setupFields: extractRelevantFields(firstSchedule, SETUP_FIELDS),

          // Track fields
          track: firstSchedule.track,
          race_week_num: firstSchedule.race_week_num,

          // Full raw entry for inspection (limited fields)
          rawSample: {
            ...firstSchedule,
            // Truncate large nested objects
            race_time_descriptors: firstSchedule.race_time_descriptors?.slice(0, 2),
          },
        };
      }

      results.sampleSeasons.push(seasonAnalysis);
    }

    // Aggregate field analysis across all samples
    const allLicenseFields = new Set<string>();
    const allCategoryFields = new Set<string>();
    const allSetupFields = new Set<string>();

    for (const season of results.sampleSeasons) {
      season.licenseFieldsFound.forEach((f: string) => allLicenseFields.add(f));
      season.categoryFieldsFound.forEach((f: string) => allCategoryFields.add(f));
      season.setupFieldsFound.forEach((f: string) => allSetupFields.add(f));
    }

    results.fieldAnalysis = {
      licenseFieldsFoundAcrossSeasons: Array.from(allLicenseFields),
      categoryFieldsFoundAcrossSeasons: Array.from(allCategoryFields),
      setupFieldsFoundAcrossSeasons: Array.from(allSetupFields),
    };

    // Generate recommendations based on findings
    if (allLicenseFields.size === 0) {
      results.recommendations.push(
        'WARNING: No license fields found in season data. License extraction will default to Rookie.'
      );
    } else {
      results.recommendations.push(
        `License fields found: ${Array.from(allLicenseFields).join(', ')}`
      );
    }

    if (allCategoryFields.size === 0) {
      results.recommendations.push(
        'WARNING: No category fields found. Category extraction will default to sports_car.'
      );
    } else {
      results.recommendations.push(
        `Category fields found: ${Array.from(allCategoryFields).join(', ')}`
      );
    }

    if (allSetupFields.size === 0) {
      results.recommendations.push(
        'WARNING: No setup fields found. Setup type will default to fixed.'
      );
    } else {
      results.recommendations.push(
        `Setup fields found: ${Array.from(allSetupFields).join(', ')}`
      );
    }

    // Also fetch one full season with complete details to see embedded schedule structure
    if (seasonsData.length > 0) {
      const sampleSeason = seasonsData[0];
      results.fullSeasonSample = {
        season_id: sampleSeason.season_id,
        series_id: sampleSeason.series_id,
        season_name: sampleSeason.season_name,
        // Include all fields for complete inspection
        allFields: { ...sampleSeason },
        // Limit schedules to first 2 entries
        schedules: sampleSeason.schedules?.slice(0, 2),
      };
    }

    return NextResponse.json({
      success: true,
      message: 'API structure analysis complete',
      ...results,
    });
  } catch (error) {
    console.error('Schedule API structure debug error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze API structure',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
