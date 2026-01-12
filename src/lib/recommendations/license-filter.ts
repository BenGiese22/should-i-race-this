import { RacingOpportunity, UserHistory, LicenseLevel, Category } from './types';
import { LicenseHelper, LicenseLevel as CentralizedLicenseLevel } from '../types/license';

/**
 * License-based filtering for racing recommendations
 * Excludes series requiring higher license levels than the user possesses
 */
export class LicenseFilter {
  /**
   * Filter racing opportunities based on user's license levels
   */
  filterByLicense(opportunities: RacingOpportunity[], userHistory: UserHistory): RacingOpportunity[] {
    // Add null safety for opportunities and userHistory
    if (!opportunities || opportunities.length === 0) {
      console.log('Debug: No opportunities to filter');
      return [];
    }
    
    if (!userHistory) {
      console.log('Debug: No user history provided');
      return []; // No user history means no eligible opportunities
    }

    if (!userHistory.licenseClasses) {
      console.log('Debug: User history has no licenseClasses property');
      return []; // No licenses means no eligible opportunities
    }

    if (userHistory.licenseClasses.length === 0) {
      console.log('Debug: User has no licenses');
      return []; // No licenses means no eligible opportunities
    }

    console.log(`Debug: Filtering ${opportunities.length} opportunities for user with ${userHistory.licenseClasses.length} licenses`);
    console.log('Debug: User licenses:', userHistory.licenseClasses);

    return opportunities.filter(opportunity => 
      this.hasRequiredLicense(opportunity, userHistory)
    );
  }

  /**
   * Check if user has the required license for a racing opportunity
   */
  hasRequiredLicense(opportunity: RacingOpportunity, userHistory: UserHistory): boolean {
    // Add comprehensive null safety
    if (!userHistory) {
      console.log('Debug: No user history provided to hasRequiredLicense');
      return false;
    }

    if (!userHistory.licenseClasses) {
      console.log('Debug: User history has no licenseClasses property');
      console.log('Debug: UserHistory object:', userHistory);
      return false;
    }

    if (!Array.isArray(userHistory.licenseClasses)) {
      console.log('Debug: licenseClasses is not an array:', typeof userHistory.licenseClasses, userHistory.licenseClasses);
      return false;
    }

    if (userHistory.licenseClasses.length === 0) {
      console.log('Debug: User has no licenses');
      return false;
    }

    // Find the user's highest license for the opportunity's category
    // Handle cases where user might have multiple licenses in the same category
    const userLicensesInCategory = userHistory.licenseClasses.filter(
      license => license.category === opportunity.category
    );

    // If user doesn't have any license for this category, they can't participate
    if (userLicensesInCategory.length === 0) {
      console.log(`Debug: User has no license for category ${opportunity.category}`);
      console.log('Debug: Available licenses:', userHistory.licenseClasses.map(l => l.category));
      return false;
    }

    // Get the highest license level in this category using centralized helper
    const highestUserLicense = userLicensesInCategory.reduce((highest, current) => {
      return LicenseHelper.compare(current.level, highest.level) > 0 ? current : highest;
    });

    // Check if user's highest license level meets the requirement using centralized helper
    return LicenseHelper.meetsRequirement(highestUserLicense.level, opportunity.licenseRequired);
  }

  /**
   * Check if a user's license level is sufficient for the required level using centralized helper
   */
  private isLicenseLevelSufficient(userLevel: LicenseLevel, requiredLevel: LicenseLevel): boolean {
    return LicenseHelper.meetsRequirement(userLevel, requiredLevel);
  }

  /**
   * Get available categories for a user based on their licenses
   */
  getAvailableCategories(userHistory: UserHistory): Category[] {
    return userHistory.licenseClasses.map(license => license.category);
  }

  /**
   * Get the highest license level for a user in a specific category
   */
  getHighestLicenseLevel(userHistory: UserHistory, category: Category): LicenseLevel | null {
    const userLicensesInCategory = userHistory.licenseClasses.filter(
      license => license.category === category
    );

    if (userLicensesInCategory.length === 0) {
      return null;
    }

    // If multiple licenses in the same category, return the highest one using centralized helper
    const highestLicense = userLicensesInCategory.reduce((highest, current) => {
      return LicenseHelper.compare(current.level, highest.level) > 0 ? current : highest;
    });

    return highestLicense.level;
  }

  /**
   * Get opportunities that the user is close to being eligible for
   * (one license level away)
   */
  getAlmostEligibleOpportunities(
    opportunities: RacingOpportunity[], 
    userHistory: UserHistory
  ): RacingOpportunity[] {
    return opportunities.filter(opportunity => {
      const userLicense = userHistory.licenseClasses.find(
        license => license.category === opportunity.category
      );

      if (!userLicense) {
        // If user has no license in this category, rookie series are "almost eligible"
        return opportunity.licenseRequired === CentralizedLicenseLevel.ROOKIE;
      }

      // Check if user is exactly one level below the requirement using centralized helper
      const userLevelValue = LicenseHelper.getNumericValue(userLicense.level);
      const requiredLevelValue = LicenseHelper.getNumericValue(opportunity.licenseRequired);

      // User is one level below the requirement
      return requiredLevelValue === userLevelValue + 1;
    });
  }

  /**
   * Group opportunities by license requirement for display purposes
   */
  groupOpportunitiesByLicense(opportunities: RacingOpportunity[]): Record<LicenseLevel, RacingOpportunity[]> {
    const grouped: Record<LicenseLevel, RacingOpportunity[]> = {};
    
    // Initialize with all license levels
    LicenseHelper.getAllLevels().forEach(level => {
      grouped[level] = [];
    });

    opportunities.forEach(opportunity => {
      grouped[opportunity.licenseRequired].push(opportunity);
    });

    return grouped;
  }

  /**
   * Get license progression suggestions for a user
   */
  getLicenseProgressionSuggestions(userHistory: UserHistory): {
    category: Category;
    currentLevel: LicenseLevel;
    nextLevel: LicenseLevel | null;
    requirements: string;
  }[] {
    const suggestions = [];

    // Get unique categories and their highest license levels
    const categoryLicenses = new Map<Category, LicenseLevel>();
    
    for (const license of userHistory.licenseClasses) {
      const existingLevel = categoryLicenses.get(license.category);
      if (!existingLevel || LicenseHelper.compare(license.level, existingLevel) > 0) {
        categoryLicenses.set(license.category, license.level);
      }
    }

    for (const [category, level] of categoryLicenses) {
      const nextLevel = this.getNextLicenseLevel(level);
      
      suggestions.push({
        category,
        currentLevel: level,
        nextLevel,
        requirements: this.getLicenseRequirements(level, nextLevel)
      });
    }

    return suggestions;
  }

  /**
   * Filter opportunities by setup type preference
   * Ensures both fixed and open setup series are included in recommendation pool
   * Requirements: 9.4
   */
  filterBySetupType(
    opportunities: RacingOpportunity[], 
    setupPreference?: 'fixed' | 'open' | 'both'
  ): RacingOpportunity[] {
    if (!setupPreference || setupPreference === 'both') {
      // Include all setup types (default behavior)
      return opportunities;
    }

    return opportunities.filter(opportunity => {
      if (setupPreference === 'fixed') {
        return !opportunity.hasOpenSetup; // Fixed setup series have hasOpenSetup = false
      } else {
        return opportunity.hasOpenSetup; // Open setup series have hasOpenSetup = true
      }
    });
  }

  /**
   * Enhanced filtering that combines license and setup type filtering
   * Ensures all eligible series are included regardless of setup type
   * Requirements: 7.1, 7.2, 7.5, 7.6, 9.4
   */
  filterOpportunities(
    opportunities: RacingOpportunity[], 
    userHistory: UserHistory,
    options: {
      setupPreference?: 'fixed' | 'open' | 'both';
      includeAllCategories?: boolean;
    } = {}
  ): RacingOpportunity[] {
    const { setupPreference = 'both', includeAllCategories = true } = options;

    // First filter by license eligibility
    const licenseEligible = this.filterByLicense(opportunities, userHistory);

    // Then filter by setup type preference (but ensure both types are available)
    const setupFiltered = this.filterBySetupType(licenseEligible, setupPreference);

    // Log filtering results for debugging
    console.log(`Debug: Enhanced filtering results:`, {
      totalOpportunities: opportunities.length,
      licenseEligible: licenseEligible.length,
      setupFiltered: setupFiltered.length,
      setupPreference,
      userCategories: userHistory.licenseClasses.map(l => l.category)
    });

    return setupFiltered;
  }

  /**
   * Get the next license level in the hierarchy using centralized helper
   */
  private getNextLicenseLevel(currentLevel: LicenseLevel): LicenseLevel | null {
    const allLevels = LicenseHelper.getAllLevels();
    const currentIndex = allLevels.indexOf(currentLevel);
    
    if (currentIndex === -1 || currentIndex === allLevels.length - 1) {
      return null; // Already at the highest level or invalid level
    }
    
    return allLevels[currentIndex + 1];
  }

  /**
   * Get requirements for license progression
   */
  private getLicenseRequirements(currentLevel: LicenseLevel, nextLevel: LicenseLevel | null): string {
    if (!nextLevel) {
      return 'Already at the highest license level';
    }

    // General requirements for license progression in iRacing
    const requirements: Record<string, string> = {
      [`${CentralizedLicenseLevel.ROOKIE}-${CentralizedLicenseLevel.D}`]: 'Complete 4 races or time trials with 3.0+ Safety Rating',
      [`${CentralizedLicenseLevel.D}-${CentralizedLicenseLevel.C}`]: 'Complete races with 3.0+ Safety Rating and meet minimum participation requirements',
      [`${CentralizedLicenseLevel.C}-${CentralizedLicenseLevel.B}`]: 'Complete races with 3.0+ Safety Rating and meet minimum participation requirements',
      [`${CentralizedLicenseLevel.B}-${CentralizedLicenseLevel.A}`]: 'Complete races with 3.0+ Safety Rating and meet minimum participation requirements',
      [`${CentralizedLicenseLevel.A}-${CentralizedLicenseLevel.PRO}`]: 'Complete races with 4.0+ Safety Rating and meet minimum participation requirements'
    };

    const key = `${currentLevel}-${nextLevel}`;
    return requirements[key] || 'Meet Safety Rating and participation requirements';
  }
}

// Export singleton instance
export const licenseFilter = new LicenseFilter();