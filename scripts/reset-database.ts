#!/usr/bin/env tsx

/**
 * Database Reset Script
 * 
 * This script completely resets the racing analytics dashboard database by:
 * 1. Dropping all existing tables
 * 2. Recreating the schema from scratch
 * 3. Optionally seeding with test data
 * 
 * WARNING: This will permanently delete ALL data in the database!
 * 
 * Usage:
 *   npm run reset-db              # Reset database only
 *   npm run reset-db --seed       # Reset database and add test data
 *   npm run reset-db --confirm    # Skip confirmation prompt
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as readline from 'readline';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('Make sure .env.local exists with your Neon database URL');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const shouldSeed = args.includes('--seed');
const skipConfirmation = args.includes('--confirm');

// Create database connection
const neonSql = neon(process.env.DATABASE_URL);
const db = drizzle(neonSql);

/**
 * Prompt user for confirmation unless --confirm flag is used
 */
async function confirmReset(): Promise<boolean> {
  if (skipConfirmation) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '⚠️  This will PERMANENTLY DELETE all data in your database. Are you sure? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * Drop all existing tables in the correct order (respecting foreign key constraints)
 */
async function dropAllTables() {
  console.log('🗑️  Dropping existing tables...');
  
  try {
    // Drop tables in reverse dependency order to avoid foreign key constraint errors
    await db.execute(sql`DROP TABLE IF EXISTS schedule_entries CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS race_results CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS license_classes CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS iracing_accounts CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    
    // Drop any remaining sequences or other objects
    await db.execute(sql`DROP SEQUENCE IF EXISTS users_id_seq CASCADE`);
    await db.execute(sql`DROP SEQUENCE IF EXISTS iracing_accounts_id_seq CASCADE`);
    await db.execute(sql`DROP SEQUENCE IF EXISTS license_classes_id_seq CASCADE`);
    await db.execute(sql`DROP SEQUENCE IF EXISTS race_results_id_seq CASCADE`);
    await db.execute(sql`DROP SEQUENCE IF EXISTS schedule_entries_id_seq CASCADE`);
    
    console.log('✅ All tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  }
}

/**
 * Recreate the database schema using Drizzle migrations
 */
async function recreateSchema() {
  console.log('🏗️  Recreating database schema...');
  
  try {
    // Run Drizzle migrations to recreate the schema
    console.log('Running drizzle migrations...');
    execSync('npx drizzle-kit push', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('✅ Database schema recreated successfully');
  } catch (error) {
    console.error('❌ Error recreating schema:', error);
    throw error;
  }
}

/**
 * Seed the database with test data (optional)
 */
async function seedTestData() {
  console.log('🌱 Seeding test data...');
  
  try {
    // Create a test user
    const testUserId = crypto.randomUUID();
    
    await db.execute(sql`
      INSERT INTO users (id, iracing_customer_id, display_name, created_at, updated_at)
      VALUES (${testUserId}, 123456, 'Test User', NOW(), NOW())
    `);
    
    // Create test iRacing account
    await db.execute(sql`
      INSERT INTO iracing_accounts (id, user_id, access_token, refresh_token, access_token_expires_at, created_at, updated_at)
      VALUES (
        ${crypto.randomUUID()}, 
        ${testUserId}, 
        'test_access_token', 
        'test_refresh_token', 
        NOW() + INTERVAL '1 hour',
        NOW(), 
        NOW()
      )
    `);
    
    // Create test license classes
    const categories = ['road', 'oval', 'dirt_road', 'dirt_oval'];
    const levels = ['D', 'C', 'B', 'A'];
    
    for (const category of categories) {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const safetyRating = (Math.random() * 3 + 1).toFixed(2); // 1.00 to 4.00
      const irating = Math.floor(Math.random() * 3000 + 1000); // 1000 to 4000
      
      await db.execute(sql`
        INSERT INTO license_classes (id, user_id, category, level, safety_rating, irating, updated_at)
        VALUES (
          ${crypto.randomUUID()}, 
          ${testUserId}, 
          ${category}, 
          ${level}, 
          ${safetyRating}, 
          ${irating}, 
          NOW()
        )
      `);
    }
    
    // Create test race results
    const seriesData = [
      { id: 1, name: 'Skip Barber Formula 2000' },
      { id: 2, name: 'Global Mazda MX-5 Cup' },
      { id: 3, name: 'Porsche Cup Series' },
    ];
    
    const trackData = [
      { id: 1, name: 'Watkins Glen International' },
      { id: 2, name: 'Road Atlanta' },
      { id: 3, name: 'Sebring International Raceway' },
    ];
    
    for (let i = 0; i < 20; i++) {
      const series = seriesData[Math.floor(Math.random() * seriesData.length)];
      const track = trackData[Math.floor(Math.random() * trackData.length)];
      const startPos = Math.floor(Math.random() * 20) + 1; // 1-20
      const finishPos = Math.floor(Math.random() * 20) + 1; // 1-20
      const incidents = Math.floor(Math.random() * 8); // 0-7
      const sof = Math.floor(Math.random() * 2000) + 1000; // 1000-3000
      
      // Random date within last 3 months
      const raceDate = new Date();
      raceDate.setDate(raceDate.getDate() - Math.floor(Math.random() * 90));
      
      await db.execute(sql`
        INSERT INTO race_results (
          id, user_id, subsession_id, series_id, series_name, track_id, track_name,
          session_type, starting_position, finishing_position, incidents, strength_of_field,
          race_date, season_year, season_quarter, race_week_num, created_at
        ) VALUES (
          ${crypto.randomUUID()}, 
          ${testUserId}, 
          ${Math.floor(Math.random() * 1000000)}, 
          ${series.id}, 
          ${series.name}, 
          ${track.id}, 
          ${track.name},
          'race', 
          ${startPos}, 
          ${finishPos}, 
          ${incidents}, 
          ${sof},
          ${raceDate.toISOString()}, 
          2024, 
          4, 
          ${Math.floor(Math.random() * 12)}, 
          NOW()
        )
      `);
    }
    
    console.log('✅ Test data seeded successfully');
    console.log(`   - Created test user with ID: ${testUserId}`);
    console.log(`   - Created 4 license classes`);
    console.log(`   - Created 20 race results`);
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

/**
 * Main reset function
 */
async function resetDatabase() {
  try {
    console.log('🏁 Racing Analytics Dashboard - Database Reset');
    console.log('='.repeat(50));
    
    // Confirm with user
    const confirmed = await confirmReset();
    if (!confirmed) {
      console.log('❌ Database reset cancelled');
      process.exit(0);
    }
    
    // Step 1: Drop all tables
    await dropAllTables();
    
    // Step 2: Recreate schema
    await recreateSchema();
    
    // Step 3: Seed test data (if requested)
    if (shouldSeed) {
      await seedTestData();
    }
    
    console.log('='.repeat(50));
    console.log('🎉 Database reset completed successfully!');
    
    if (shouldSeed) {
      console.log('');
      console.log('Test data has been added. You can now:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. Visit http://127.0.0.1:3000');
      console.log('3. Use the test user credentials to explore the dashboard');
    } else {
      console.log('');
      console.log('Database is now clean. You can:');
      console.log('1. Start the development server: npm run dev');
      console.log('2. Login with your iRacing account');
      console.log('3. Sync your race data');
    }
    
  } catch (error) {
    console.error('💥 Database reset failed:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();