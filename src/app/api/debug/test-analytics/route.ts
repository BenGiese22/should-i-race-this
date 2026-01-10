import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { analyticsIntegration } from '@/lib/recommendations/analytics-integration';
import { prepareUserHistory } from '@/lib/recommendations/data-preparation';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Debug: Testing analytics for user ${session.userId}`);

    // Test the analytics integration directly
    const performanceData = await analyticsIntegration.getUserPerformanceData(session.userId);
    console.log('Debug: Performance data:', performanceData);

    // Test the user history preparation
    const userHistory = await prepareUserHistory(session.userId);
    console.log('Debug: User history:', userHistory);

    return NextResponse.json({
      userId: session.userId,
      performanceData,
      userHistory,
      success: true
    });
  } catch (error) {
    console.error('Test analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to test analytics', details: String(error) },
      { status: 500 }
    );
  }
}