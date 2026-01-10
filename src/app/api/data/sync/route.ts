/**
 * Data Synchronization API Endpoint
 * 
 * POST /api/data/sync - Trigger race data synchronization for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndProfile } from '@/lib/auth/server';
import { syncUserRaceData, getUserSyncStatus, needsSync } from '@/lib/iracing/sync';

export async function POST(request: NextRequest) {
  return withAuthAndProfile(request, async (user, profile) => {
    try {
      // Check if sync is needed
      const syncStatus = await getUserSyncStatus(user.id);
      
      // Allow force sync via query parameter
      const url = new URL(request.url);
      const forceSync = url.searchParams.get('force') === 'true';
      
      if (!forceSync && !needsSync(syncStatus.lastSyncAt)) {
        return NextResponse.json({
          success: true,
          message: 'Sync not needed - data is up to date',
          syncStatus,
        });
      }

      // Start synchronization
      const result = await syncUserRaceData(
        user.id,
        profile.cust_id
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Sync completed successfully. Added ${result.progress.newRaces} new races.`,
          progress: result.progress,
          syncStatus: await getUserSyncStatus(user.id),
        });
      } else {
        return NextResponse.json({
          success: false,
          message: result.error || 'Sync failed',
          progress: result.progress,
        }, { status: 500 });
      }

    } catch (error) {
      console.error('Sync API error:', error);
      return NextResponse.json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  });
}

export async function GET(request: NextRequest) {
  return withAuthAndProfile(request, async (user) => {
    try {
      const syncStatus = await getUserSyncStatus(user.id);
      
      return NextResponse.json({
        success: true,
        syncStatus,
        needsSync: needsSync(syncStatus.lastSyncAt),
      });

    } catch (error) {
      console.error('Sync status API error:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to get sync status',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  });
}