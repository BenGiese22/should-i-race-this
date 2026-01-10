import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSeason } from '@/lib/iracing/client';

/**
 * Test endpoint to debug API calls without authentication
 * This is for development/debugging purposes only
 */
export async function GET(request: NextRequest) {
  try {
    // Test basic functionality without authentication
    const currentSeason = getCurrentSeason();
    
    // Test URL construction
    const testParams = {
      cust_id: 974459,
      season_year: 2025,
      season_quarter: 4,
    };
    
    const baseUrl = 'https://members-ng.iracing.com/data';
    const endpoint = '/results/search_series';
    const url = new URL(`${baseUrl}${endpoint}`);
    
    Object.entries(testParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    return NextResponse.json({
      success: true,
      debug: {
        currentSeason,
        testUrl: url.toString(),
        testParams,
        message: 'API URL construction test - this would be the URL called with authentication',
        note: 'To test actual API calls, authentication with iRacing is required',
      },
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}