import { eq, and, sql, count } from 'drizzle-orm';
import { db } from '../db';
import { raceResults, scheduleEntries } from '../db/schema';
import type { Category } from './types';

export interface CategoryAnalysis {
  primaryCategory: Category;
  confidence: number; // 0-1, based on percentage
  raceDistribution: CategoryDistribution;
}

export interface CategoryDistribution {
  sports_car: number;
  formula_car: number;
  oval: number;
  dirt_road: number;
  dirt_oval: number;
  total: number;
}

/**
 * CategoryAnalyzer class for detecting user's primary racing category
 * Requirements: 9.1, 9.2
 */
export class CategoryAnalyzer {
  /**
   * Detect user's primary racing category based on race distribution
   * Requirements: 9.1, 9.2
   */
  async detectPrimaryCategory(userId: string): Promise<CategoryAnalysis> {
    const raceDistribution = await this.getCategoryDistribution(userId);
    
    // If user has no races, default to sports_car (most common road racing)
    if (raceDistribution.total === 0) {
      return {
        primaryCategory: 'sports_car',
        confidence: 0,
        raceDistribution
      };
    }

    // Calculate percentages for each category
    const sportsCarPercentage = raceDistribution.sports_car / raceDistribution.total;
    const formulaCarPercentage = raceDistribution.formula_car / raceDistribution.total;
    const ovalPercentage = raceDistribution.oval / raceDistribution.total;
    const dirtRoadPercentage = raceDistribution.dirt_road / raceDistribution.total;
    const dirtOvalPercentage = raceDistribution.dirt_oval / raceDistribution.total;

    // Check for 70% threshold (high confidence primary category)
    if (sportsCarPercentage >= 0.7) {
      return {
        primaryCategory: 'sports_car',
        confidence: sportsCarPercentage,
        raceDistribution
      };
    }
    if (formulaCarPercentage >= 0.7) {
      return {
        primaryCategory: 'formula_car',
        confidence: formulaCarPercentage,
        raceDistribution
      };
    }
    if (ovalPercentage >= 0.7) {
      return {
        primaryCategory: 'oval',
        confidence: ovalPercentage,
        raceDistribution
      };
    }
    if (dirtRoadPercentage >= 0.7) {
      return {
        primaryCategory: 'dirt_road',
        confidence: dirtRoadPercentage,
        raceDistribution
      };
    }
    if (dirtOvalPercentage >= 0.7) {
      return {
        primaryCategory: 'dirt_oval',
        confidence: dirtOvalPercentage,
        raceDistribution
      };
    }

    // If no clear primary (70%+), return the category with most races
    const maxRaces = Math.max(
      raceDistribution.sports_car,
      raceDistribution.formula_car,
      raceDistribution.oval,
      raceDistribution.dirt_road,
      raceDistribution.dirt_oval
    );

    let primaryCategory: Category;
    let confidence: number;

    if (raceDistribution.sports_car === maxRaces) {
      primaryCategory = 'sports_car';
      confidence = sportsCarPercentage;
    } else if (raceDistribution.formula_car === maxRaces) {
      primaryCategory = 'formula_car';
      confidence = formulaCarPercentage;
    } else if (raceDistribution.oval === maxRaces) {
      primaryCategory = 'oval';
      confidence = ovalPercentage;
    } else if (raceDistribution.dirt_road === maxRaces) {
      primaryCategory = 'dirt_road';
      confidence = dirtRoadPercentage;
    } else {
      primaryCategory = 'dirt_oval';
      confidence = dirtOvalPercentage;
    }

    return {
      primaryCategory,
      confidence,
      raceDistribution
    };
  }

  /**
   * Get race distribution by category for a user
   * Joins race results with schedule entries to determine category for each race
   */
  async getCategoryDistribution(userId: string): Promise<CategoryDistribution> {
    // Join race results with schedule entries to get category information
    // We need to match on series, track, season, and race week to get the correct category
    const results = await db
      .select({
        category: scheduleEntries.category,
        raceCount: count()
      })
      .from(raceResults)
      .innerJoin(
        scheduleEntries,
        and(
          eq(raceResults.seriesId, scheduleEntries.seriesId),
          eq(raceResults.trackId, scheduleEntries.trackId),
          eq(raceResults.seasonYear, scheduleEntries.seasonYear),
          eq(raceResults.seasonQuarter, scheduleEntries.seasonQuarter),
          eq(raceResults.raceWeekNum, scheduleEntries.raceWeekNum)
        )
      )
      .where(
        and(
          eq(raceResults.userId, userId),
          eq(raceResults.sessionType, 'race') // Only count actual races
        )
      )
      .groupBy(scheduleEntries.category);

    const distribution: CategoryDistribution = {
      sports_car: 0,
      formula_car: 0,
      oval: 0,
      dirt_road: 0,
      dirt_oval: 0,
      total: 0
    };

    results.forEach(result => {
      const category = result.category as Category;
      const raceCount = result.raceCount;
      
      if (category in distribution) {
        distribution[category] = raceCount;
        distribution.total += raceCount;
      }
    });

    return distribution;
  }
}

// Export singleton instance
export const categoryAnalyzer = new CategoryAnalyzer();