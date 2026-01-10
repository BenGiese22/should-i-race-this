#!/usr/bin/env tsx

/**
 * Migration script to update license categories from 4-category to 5-category system
 * 
 * This script:
 * 1. Backs up existing license data
 * 2. Splits 'road' licenses into 'sports_car' and 'formula_car' based on series participation
 * 3. Updates the database schema to support 5 categories
 * 4. Validates migration results
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, sql } from 'drizzle-orm';
import { licenseClasses, raceResults, scheduleEntries } from '../src/lib/db/schema';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = neon(connectionString);
const db = drizzle(client);

interface LicenseBackup {
  id: string;
  userId: string;
  category: string;
  level: string;
  safetyRating: string;
  irating: number;
  updatedAt: Date | null;
}

interface MigrationStats {
  totalRoadLicenses: number;
  convertedToSportsCar: number;
  convertedToFormulaCar: number;
  errors: string[];
}

/**
 * Backup existing license data before migration
 */
async function backupLicenseData(): Promise<LicenseBackup[]> {
  console.log('📦 Backing up existing license data...');
  
  const licenses = await db
    .select()
    .from(licenseClasses)
    .where(eq(licenseClasses.category, 'road'));
  
  console.log(`✅ Backed up ${licenses.length} road licenses`);
  return licenses;
}

/**
 * Determine if a user should get sports_car or formula_car license
 * Based on their race participation in different series types
 */
async function determineLicenseCategory(userId: string): Promise<'sports_car' | 'formula_car'> {
  // Get user's race history to determine preference
  const raceHistory = await db
    .select({
      seriesId: raceResults.seriesId,
      seriesName: raceResults.seriesName,
      raceCount: sql<number>`count(*)`.as('race_count')
    })
    .from(raceResults)
    .where(eq(raceResults.userId, userId))
    .groupBy(raceResults.seriesId, raceResults.seriesName)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  if (raceHistory.length === 0) {
    // No race history, default to sports_car
    return 'sports_car';
  }

  // Check if user has more formula car series participation
  const formulaKeywords = ['formula', 'f1', 'f3', 'f4', 'indycar', 'indy', 'open wheel'];
  const sportsCarKeywords = ['gt', 'touring', 'sports car', 'imsa', 'endurance', 'prototype'];

  let formulaScore = 0;
  let sportsCarScore = 0;

  for (const race of raceHistory) {
    const seriesNameLower = race.seriesName.toLowerCase();
    const raceWeight = Number(race.raceCount);

    // Check for formula car indicators
    if (formulaKeywords.some(keyword => seriesNameLower.includes(keyword))) {
      formulaScore += raceWeight;
    }

    // Check for sports car indicators
    if (sportsCarKeywords.some(keyword => seriesNameLower.includes(keyword))) {
      sportsCarScore += raceWeight;
    }
  }

  // If formula score is significantly higher, assign formula_car
  if (formulaScore > sportsCarScore * 1.5) {
    return 'formula_car';
  }

  // Default to sports_car (most common road racing)
  return 'sports_car';
}

/**
 * Migrate road licenses to sports_car and formula_car
 */
async function migrateLicenses(backupData: LicenseBackup[]): Promise<MigrationStats> {
  console.log('🔄 Starting license category migration...');
  
  const stats: MigrationStats = {
    totalRoadLicenses: backupData.length,
    convertedToSportsCar: 0,
    convertedToFormulaCar: 0,
    errors: []
  };

  for (const license of backupData) {
    try {
      // Determine new category based on user's racing history
      const newCategory = await determineLicenseCategory(license.userId);
      
      // Update the license category
      await db
        .update(licenseClasses)
        .set({ 
          category: newCategory,
          updatedAt: new Date()
        })
        .where(and(
          eq(licenseClasses.userId, license.userId),
          eq(licenseClasses.category, 'road')
        ));

      if (newCategory === 'sports_car') {
        stats.convertedToSportsCar++;
      } else {
        stats.convertedToFormulaCar++;
      }

      console.log(`✅ Migrated user ${license.userId} road license to ${newCategory}`);
      
    } catch (error) {
      const errorMsg = `Failed to migrate license for user ${license.userId}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }
  }

  return stats;
}

/**
 * Update schedule entries to use new category system
 */
async function updateScheduleCategories(): Promise<void> {
  console.log('🔄 Updating schedule entries categories...');
  
  // Update road categories in schedule to sports_car (most common)
  const result = await db
    .update(scheduleEntries)
    .set({ category: 'sports_car' })
    .where(eq(scheduleEntries.category, 'road'));

  console.log(`✅ Updated schedule entries: ${result.rowCount || 0} records`);
}

/**
 * Validate migration results
 */
async function validateMigration(): Promise<boolean> {
  console.log('🔍 Validating migration results...');
  
  // Check that no 'road' licenses remain
  const remainingRoadLicenses = await db
    .select({ count: sql<number>`count(*)` })
    .from(licenseClasses)
    .where(eq(licenseClasses.category, 'road'));

  const roadCount = remainingRoadLicenses[0]?.count || 0;
  
  if (roadCount > 0) {
    console.error(`❌ Migration incomplete: ${roadCount} road licenses still exist`);
    return false;
  }

  // Check that we have the expected 5 categories
  const categoryDistribution = await db
    .select({
      category: licenseClasses.category,
      count: sql<number>`count(*)`
    })
    .from(licenseClasses)
    .groupBy(licenseClasses.category);

  console.log('📊 License category distribution after migration:');
  for (const dist of categoryDistribution) {
    console.log(`  ${dist.category}: ${dist.count}`);
  }

  const validCategories = ['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road'];
  const foundCategories = categoryDistribution.map(d => d.category);
  
  for (const category of foundCategories) {
    if (!validCategories.includes(category)) {
      console.error(`❌ Invalid category found: ${category}`);
      return false;
    }
  }

  console.log('✅ Migration validation passed');
  return true;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting license category migration to 5-category system');
  console.log('📅', new Date().toISOString());
  
  try {
    // Step 1: Backup existing data
    const backupData = await backupLicenseData();
    
    if (backupData.length === 0) {
      console.log('ℹ️  No road licenses found to migrate');
      return;
    }

    // Step 2: Migrate licenses
    const stats = await migrateLicenses(backupData);
    
    // Step 3: Update schedule entries
    await updateScheduleCategories();
    
    // Step 4: Validate migration
    const isValid = await validateMigration();
    
    // Step 5: Report results
    console.log('\n📊 Migration Summary:');
    console.log(`  Total road licenses: ${stats.totalRoadLicenses}`);
    console.log(`  Converted to sports_car: ${stats.convertedToSportsCar}`);
    console.log(`  Converted to formula_car: ${stats.convertedToFormulaCar}`);
    console.log(`  Errors: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (isValid && stats.errors.length === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with issues. Please review the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as migrateLicenseCategories };