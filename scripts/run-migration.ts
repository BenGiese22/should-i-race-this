/**
 * Script to run the race_time_descriptors migration
 * Run with: npx tsx scripts/run-migration.ts
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔗 Connecting to database...');
console.log(`   Database: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown'}`);

const sql = neon(DATABASE_URL);

async function runMigration() {
  try {
    console.log('\n🚀 Running migration...');

    // Run the ALTER TABLE command
    console.log('   Step 1: Adding race_time_descriptors column...');
    await sql`
      ALTER TABLE schedule_entries 
      ADD COLUMN IF NOT EXISTS race_time_descriptors JSONB
    `;
    console.log('   ✅ Column added');

    // Add the comment
    console.log('   Step 2: Adding column comment...');
    await sql`
      COMMENT ON COLUMN schedule_entries.race_time_descriptors IS 'Stores race_time_descriptors from iRacing API containing session times, repeating schedules, and timing information'
    `;
    console.log('   ✅ Comment added');

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Verifying column was added...');

    // Verify the column was added
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'schedule_entries' 
      AND column_name = 'race_time_descriptors'
    `;

    if (result.length > 0) {
      console.log('✅ Column verified:');
      console.log(`   - Column: ${result[0].column_name}`);
      console.log(`   - Type: ${result[0].data_type}`);
    } else {
      console.log('⚠️  Column not found in verification query');
    }

    console.log('\n🎉 Migration deployment complete!');
    console.log('\nNext steps:');
    console.log('1. ✅ Database migration - DONE');
    console.log('2. ⏭️  Re-sync schedules to populate race_time_descriptors');
    console.log('3. ⏭️  Test with debug endpoint: /api/debug/next-race-times');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

runMigration();
