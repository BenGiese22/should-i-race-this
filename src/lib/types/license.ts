/**
 * Centralized License Level Management
 * 
 * This module provides a single source of truth for license level handling,
 * including normalization between different formats used by iRacing API
 * and our internal systems.
 */

export enum LicenseLevel {
  ROOKIE = 'Rookie',
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
  PRO = 'Pro'
}

/**
 * iRacing license group numbers to our enum mapping
 * iRacing uses 1-based license groups: 1=Rookie, 2=D, 3=C, 4=B, 5=A, 6=Pro
 */
const LICENSE_GROUP_TO_ENUM: Record<number, LicenseLevel> = {
  1: LicenseLevel.ROOKIE,
  2: LicenseLevel.D,
  3: LicenseLevel.C,
  4: LicenseLevel.B,
  5: LicenseLevel.A,
  6: LicenseLevel.PRO
};

/**
 * Enum to iRacing license group numbers
 */
const ENUM_TO_LICENSE_GROUP: Record<LicenseLevel, number> = {
  [LicenseLevel.ROOKIE]: 1,
  [LicenseLevel.D]: 2,
  [LicenseLevel.C]: 3,
  [LicenseLevel.B]: 4,
  [LicenseLevel.A]: 5,
  [LicenseLevel.PRO]: 6
};

/**
 * Numeric values for comparison/sorting (higher = better license)
 */
const LICENSE_NUMERIC_VALUES: Record<LicenseLevel, number> = {
  [LicenseLevel.ROOKIE]: 0,
  [LicenseLevel.D]: 1,
  [LicenseLevel.C]: 2,
  [LicenseLevel.B]: 3,
  [LicenseLevel.A]: 4,
  [LicenseLevel.PRO]: 5
};

export class LicenseHelper {
  /**
   * Normalize any license input to our standard LicenseLevel enum
   */
  static normalize(input: string | number | null | undefined): LicenseLevel {
    if (input === null || input === undefined) {
      return LicenseLevel.ROOKIE;
    }

    // Handle numeric input (iRacing license_group)
    if (typeof input === 'number') {
      return LICENSE_GROUP_TO_ENUM[input] || LicenseLevel.ROOKIE;
    }

    // Handle string input
    const normalized = input.toString().toLowerCase().trim();
    
    switch (normalized) {
      case 'rookie':
      case 'class rookie':
      case '1':
        return LicenseLevel.ROOKIE;
      case 'd':
      case 'class d':
      case '2':
        return LicenseLevel.D;
      case 'c':
      case 'class c':
      case '3':
        return LicenseLevel.C;
      case 'b':
      case 'class b':
      case '4':
        return LicenseLevel.B;
      case 'a':
      case 'class a':
      case '5':
        return LicenseLevel.A;
      case 'pro':
      case 'professional':
      case '6':
        return LicenseLevel.PRO;
      default:
        console.warn(`Unknown license level: ${input}, defaulting to Rookie`);
        return LicenseLevel.ROOKIE;
    }
  }

  /**
   * Convert license level to iRacing license_group number
   */
  static toIRacingGroup(license: LicenseLevel): number {
    return ENUM_TO_LICENSE_GROUP[license];
  }

  /**
   * Convert iRacing license_group number to our enum
   */
  static fromIRacingGroup(licenseGroup: number): LicenseLevel {
    return LICENSE_GROUP_TO_ENUM[licenseGroup] || LicenseLevel.ROOKIE;
  }

  /**
   * Get numeric value for comparison (higher = better license)
   */
  static getNumericValue(license: LicenseLevel): number {
    return LICENSE_NUMERIC_VALUES[license];
  }

  /**
   * Compare two license levels
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  static compare(a: LicenseLevel, b: LicenseLevel): number {
    const aValue = LICENSE_NUMERIC_VALUES[a];
    const bValue = LICENSE_NUMERIC_VALUES[b];
    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
  }

  /**
   * Check if user meets minimum license requirement
   */
  static meetsRequirement(userLicense: LicenseLevel, required: LicenseLevel): boolean {
    return this.getNumericValue(userLicense) >= this.getNumericValue(required);
  }

  /**
   * Get all license levels in order (lowest to highest)
   */
  static getAllLevels(): LicenseLevel[] {
    return [
      LicenseLevel.ROOKIE,
      LicenseLevel.D,
      LicenseLevel.C,
      LicenseLevel.B,
      LicenseLevel.A,
      LicenseLevel.PRO
    ];
  }

  /**
   * Get display name for UI (same as enum value for now)
   */
  static getDisplayName(license: LicenseLevel): string {
    return license;
  }

  /**
   * Get lowercase version for database storage or API calls
   */
  static toLowercase(license: LicenseLevel): string {
    return license.toLowerCase();
  }

  /**
   * Validate if a string is a valid license level
   */
  static isValid(input: string): boolean {
    try {
      this.normalize(input);
      return true;
    } catch {
      return false;
    }
  }
}

// Export type for use in other modules
export type LicenseLevelType = LicenseLevel;

// Legacy compatibility - can be removed once all code is migrated
export const LEGACY_LICENSE_LEVELS = ['rookie', 'D', 'C', 'B', 'A', 'pro'] as const;