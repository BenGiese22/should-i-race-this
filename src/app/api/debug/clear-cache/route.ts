import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { analyticsIntegration } from '@/lib/recommendations/analytics-integration';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear all caches
    analyticsIntegration.clearCaches();

    return NextResponse.json({
      message: 'All caches cleared successfully',
      success: true
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear caches', details: String(error) },
      { status: 500 }
    );
  }
}