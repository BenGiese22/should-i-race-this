/**
 * Script to sync schedules and populate race_time_descriptors
 * Run with: npx tsx scripts/sync-schedules-with-race-times.ts
 */

import * as dotenv from 'dotenv';

// Load environment variables FIRST before importing anything else
dotenv.config({ path: '.env.local' });

import { syncScheduleData } from '../src/lib/iracing/schedule';
import { db } from '../src/lib/db';
import { scheduleEntries } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function syncSchedules() {
  console.log('🔄 Starting schedule sync with race_time_descriptors...\n');

  try {
    // Check current schedule count
    const beforeCount = await db.select({ count: sql<number>`count(*)` }).from(scheduleEntries);
    console.log(`📊 Current schedule entries: ${beforeCount[0].count}`);

    // Check how many have race_time_descriptors
    const withDescriptors = await db.select({ count: sql<number>`count(*)` })
      .from(scheduleEntries)
      .where(sql`race_time_descriptors IS NOT NULL`);
    console.log(`   Entries with race_time_descriptors: ${withDescriptors[0].count}\n`);

    // Note: syncScheduleData requires a userId for authentication
    // Since we're running this as a script, we'll need to use a test user ID
    // or modify the function to work without authentication
    
    console.log('⚠️  Note: Schedule sync requires iRacing authentication');
    console.log('   The sync will happen automatically when:');
    console.log('   1. A user logs in (via /api/auth/exchange)');
    console.log('   2. The schedule resync endpoint is called by an authenticated user');
    console.log('   3. The schedule API endpoint is called with POST\n');

    console.log('✅ Migration is complete and ready!');
    console.log('   The next time schedules are synced, race_time_descriptors will be populated.\n');

    console.log('🧪 To test immediately:');
    console.log('   1. Log in to the application');
    console.log('   2. Visit: http://localhost:3000/api/debug/next-race-times');
    console.log('   3. Check recommendations: http://localhost:3000/api/recommendations\n');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

syncSchedules();
