import { NextRequest, NextResponse } from 'next/server';
import { analyticsIntegration } from '@/lib/recommendations/analytics-integration';

export async function GET(request: NextRequest) {
  try {
    const userId = '344a8f2d-aaef-4a91-8b47-41f38d1769d2'; // Known user ID
    
    console.log('=== Debug License Query Endpoint ===');
    console.log('Testing license query for user:', userId);
    
    // Test the analytics integration directly
    const performanceData = await analyticsIntegration.getUserPerformanceData(userId);
    
    return NextResponse.json({
      success: true,
      userId,
      licenseCount: performanceData.licenseClasses?.length || 0,
      licenses: performanceData.licenseClasses,
      primaryCategory: performanceData.primaryCategory,
      overallStats: performanceData.overallStats
    });
    
  } catch (error) {
    console.error('Debug license query error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}