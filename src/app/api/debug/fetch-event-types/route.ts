import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { makeAuthenticatedRequest } from '@/lib/iracing/client';

/**
 * Fetch official event types from iRacing API
 */
export async function GET(request: NextRequest) {
  return withAuthAndProfile(request, async (user, _profile) => {
    try {
      // Fetch official event types from iRacing
      const eventTypesResponse = await makeAuthenticatedRequest(user.id, '/constants/event_types', {});
      
      return NextResponse.json({
        success: true,
        userId: user.id,
        officialEventTypes: eventTypesResponse,
        analysis: {
          totalEventTypes: Array.isArray(eventTypesResponse) ? eventTypesResponse.length : 0,
          eventTypesSample: Array.isArray(eventTypesResponse) ? eventTypesResponse.slice(0, 10) : [],
        },
      });

    } catch (error) {
      console.error('Fetch event types error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      }, { status: 500 });
    }
  });
}