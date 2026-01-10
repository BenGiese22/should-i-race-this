import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { licenseClasses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check license data directly
    const licenses = await db
      .select()
      .from(licenseClasses)
      .where(eq(licenseClasses.userId, session.userId));

    return NextResponse.json({
      userId: session.userId,
      licenseCount: licenses.length,
      licenses: licenses,
      success: true
    });
  } catch (error) {
    console.error('License check error:', error);
    return NextResponse.json(
      { error: 'Failed to check licenses', details: String(error) },
      { status: 500 }
    );
  }
}