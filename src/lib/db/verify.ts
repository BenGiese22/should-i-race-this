/**
 * Database schema verification script
 * Tests connection, schema integrity, and basic operations
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import { db } from './index';
import { users, raceResults } from './schema';
import { sql, eq } from 'drizzle-orm';

export async function verifyDatabaseSchema() {
  console.log('🔍 Verifying database schema...');

  try {
    // Test 1: Basic connection
    console.log('1. Testing database connection...');
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');

    // Test 2: Verify all tables exist
    console.log('2. Verifying table existence...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tableNames = tables.rows ? tables.rows.map((row: any) => row.table_name) : [];
    console.log('Table names:', tableNames);
    const expectedTables = ['users', 'iracing_accounts', 'license_classes', 'race_results', 'schedule_entries'];
    
    for (const expectedTable of expectedTables) {
      if (tableNames.includes(expectedTable)) {
        console.log(`✅ Table '${expectedTable}' exists`);
      } else {
        throw new Error(`❌ Table '${expectedTable}' not found`);
      }
    }

    // Test 3: Verify computed column (position_delta)
    console.log('3. Verifying computed column...');
    const computedColumnTest = await db.execute(sql`
      SELECT column_name, is_generated, generation_expression
      FROM information_schema.columns 
      WHERE table_name = 'race_results' 
      AND column_name = 'position_delta'
    `);
    
    if (computedColumnTest.rows && computedColumnTest.rows.length > 0) {
      console.log('✅ Computed column position_delta exists');
      console.log(`   Generation: ${computedColumnTest.rows[0].generation_expression}`);
    } else {
      throw new Error('❌ Computed column position_delta not found');
    }

    // Test 4: Verify indexes
    console.log('4. Verifying performance indexes...');
    const indexes = await db.execute(sql`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('race_results', 'schedule_entries')
      ORDER BY tablename, indexname
    `);
    
    const indexNames = indexes.rows ? indexes.rows.map((row: any) => row.indexname) : [];
    const expectedIndexes = [
      'idx_race_results_user_series',
      'idx_race_results_user_track', 
      'idx_race_results_date',
      'idx_race_results_season',
      'idx_race_results_user_season',
      'idx_race_results_subsession',
      'idx_schedule_entries_season',
      'idx_schedule_entries_week',
      'idx_schedule_entries_series_track'
    ];

    for (const expectedIndex of expectedIndexes) {
      if (indexNames.includes(expectedIndex)) {
        console.log(`✅ Index '${expectedIndex}' exists`);
      } else {
        console.log(`⚠️  Index '${expectedIndex}' not found (may be expected)`);
      }
    }

    // Test 5: Verify unique constraints
    console.log('5. Verifying unique constraints...');
    const constraints = await db.execute(sql`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE contype = 'u' 
      AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY conname
    `);
    
    console.log(`✅ Found ${constraints.rows ? constraints.rows.length : 0} unique constraints`);

    // Test 6: Test basic CRUD operations (without transactions due to neon-http limitations)
    console.log('6. Testing basic operations...');
    
    try {
      // Test insert and select (we'll clean up manually)
      const testUser = await db.insert(users).values({
        iracingCustomerId: 999999,
        displayName: 'Test User',
      }).returning();
      
      console.log('✅ User insert successful');

      // Insert test race result
      const testResult = await db.insert(raceResults).values({
        userId: testUser[0].id,
        subsessionId: 123456789,
        seriesId: 1,
        seriesName: 'Test Series',
        trackId: 1,
        trackName: 'Test Track',
        sessionType: 'race',
        startingPosition: 10,
        finishingPosition: 5,
        incidents: 2,
        raceDate: new Date(),
        seasonYear: 2024,
        seasonQuarter: 4,
      }).returning();

      console.log('✅ Race result insert successful');
      console.log(`   Position delta: ${testResult[0].positionDelta} (computed automatically)`);

      // Verify computed column works
      if (testResult[0].positionDelta === 5) { // 10 - 5 = 5
        console.log('✅ Computed column calculation verified');
      } else {
        throw new Error(`❌ Computed column incorrect: expected 5, got ${testResult[0].positionDelta}`);
      }

      // Clean up test data
      await db.delete(raceResults).where(eq(raceResults.id, testResult[0].id));
      await db.delete(users).where(eq(users.id, testUser[0].id));
      console.log('✅ Test data cleaned up successfully');

    } catch (error) {
      console.error('❌ Basic operations test failed:', error);
      throw error;
    }

    console.log('\n🎉 Database schema verification completed successfully!');
    console.log('📊 Schema is ready for racing analytics operations');
    
    return {
      success: true,
      tables: tableNames,
      indexes: indexNames.length,
      constraints: constraints.rows ? constraints.rows.length : 0,
    };

  } catch (error) {
    console.error('❌ Database schema verification failed:', error);
    throw error;
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyDatabaseSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}