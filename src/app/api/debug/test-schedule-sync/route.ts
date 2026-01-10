import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { syncScheduleData } from '@/lib/iracing/schedule';
import { makeAuthenticatedRequest, getCurrentSeason } from '@/lib/iracing/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('=== Manual Schedule Sync Test ===');
    console.log('User ID:', session.userId);
    
    const currentSeason = getCurrentSeason();
    console.log('Current season:', currentSeason);

    // Test different endpoints individually
    const testResults: any = {
      currentSeason,
      tests: []
    };

    // Test 1: /season/race_guide
    try {
      console.log('Testing /season/race_guide...');
      const raceGuideResult = await makeAuthenticatedRequest(
        session.userId,
        '/season/race_guide',
        {}
      );
      testResults.tests.push({
        endpoint: '/season/race_guide',
        success: true,
        data: raceGuideResult,
        keys: Object.keys(raceGuideResult || {}),
      });
    } catch (error) {
      testResults.tests.push({
        endpoint: '/season/race_guide',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 2: /series/seasons
    try {
      console.log('Testing /series/seasons...');
      const seasonsResult = await makeAuthenticatedRequest(
        session.userId,
        '/series/seasons',
        { 
          season_year: currentSeason.year,
          season_quarter: currentSeason.quarter,
          include_series: true
        }
      );
      testResults.tests.push({
        endpoint: '/series/seasons',
        success: true,
        data: seasonsResult,
        keys: Object.keys(seasonsResult || {}),
        dataType: Array.isArray(seasonsResult) ? 'array' : typeof seasonsResult,
        length: Array.isArray(seasonsResult) ? seasonsResult.length : 'N/A',
      });
    } catch (error) {
      testResults.tests.push({
        endpoint: '/series/seasons',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 3: /series/season_list
    try {
      console.log('Testing /series/season_list...');
      const seasonListResult = await makeAuthenticatedRequest(
        session.userId,
        '/series/season_list',
        { 
          season_year: currentSeason.year,
          season_quarter: currentSeason.quarter,
          include_series: true
        }
      );
      testResults.tests.push({
        endpoint: '/series/season_list',
        success: true,
        data: seasonListResult,
        keys: Object.keys(seasonListResult || {}),
        dataType: Array.isArray(seasonListResult) ? 'array' : typeof seasonListResult,
        length: Array.isArray(seasonListResult) ? seasonListResult.length : 'N/A',
      });
    } catch (error) {
      testResults.tests.push({
        endpoint: '/series/season_list',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 4: Test individual season schedule call
    try {
      console.log('Testing individual season schedule call...');
      const seasonsResult = await makeAuthenticatedRequest(
        session.userId,
        '/series/seasons',
        { 
          season_year: currentSeason.year,
          season_quarter: currentSeason.quarter,
          include_series: true
        }
      );
      
      if (seasonsResult && Array.isArray(seasonsResult) && seasonsResult.length > 0) {
        const firstSeason = seasonsResult[0];
        console.log('Testing season schedule for season_id:', firstSeason.season_id);
        
        const scheduleResult = await makeAuthenticatedRequest(
          session.userId,
          '/series/season_schedule',
          { season_id: firstSeason.season_id }
        );
        
        testResults.tests.push({
          endpoint: '/series/season_schedule',
          success: true,
          seasonData: firstSeason,
          scheduleData: scheduleResult,
          scheduleDataType: Array.isArray(scheduleResult) ? 'array' : typeof scheduleResult,
          scheduleLength: Array.isArray(scheduleResult) ? scheduleResult.length : 'N/A',
          firstScheduleEntry: Array.isArray(scheduleResult) && scheduleResult.length > 0 ? scheduleResult[0] : null,
        });
      }
    } catch (error) {
      testResults.tests.push({
        endpoint: '/series/season_schedule',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 5: Full sync function
    try {
      console.log('Testing full syncScheduleData function...');
      const syncResult = await syncScheduleData(session.userId);
      testResults.fullSync = {
        success: true,
        result: syncResult,
      };
    } catch (error) {
      testResults.fullSync = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      };
    }

    return NextResponse.json({
      success: true,
      testResults,
      message: 'Schedule sync tests completed'
    });
  } catch (error) {
    console.error('Manual schedule sync test error:', error);
    return NextResponse.json(
      { 
        error: 'Schedule sync test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}