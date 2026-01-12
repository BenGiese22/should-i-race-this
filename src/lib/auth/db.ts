import { db } from '../db';
import { users, iracingAccounts, licenseClasses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from './crypto';
import { LicenseHelper, LicenseLevel } from '../types/license';
import { Category, CategoryHelper } from '../types/category';

export interface UserProfile {
  id: string;
  iracingCustomerId: number;
  displayName: string;
  licenseClasses: Array<{
    category: string;
    level: string;
    safetyRating: number;
    iRating: number;
  }>;
  createdAt: Date;
  lastSyncAt: Date | null;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Extract profile fields from iRacing response (handles various response formats)
 */
function extractProfileFields(profile: any) {
  const candidates = [
    profile,
    profile?.data,
    profile?.profile,
    profile?.customer,
    profile?.member,
    Array.isArray(profile?.data) ? profile.data[0] : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const iracingCustId =
      candidate?.cust_id ??
      candidate?.iracing_cust_id ??
      candidate?.iracing_custId ??
      candidate?.customer_id ??
      candidate?.user_id ??
      candidate?.id ??
      null;
    const iracingName =
      candidate?.display_name ??
      candidate?.name ??
      candidate?.cust_name ??
      candidate?.iracing_name ??
      candidate?.full_name ??
      null;

    if (iracingCustId && iracingName) {
      return { 
        cust_id: Number(iracingCustId), 
        display_name: String(iracingName),
        licenses: candidate?.licenses || profile?.licenses || []
      };
    }
  }

  return { cust_id: null, display_name: null, licenses: [] };
}

/**
 * Create or update user from iRacing profile data
 */
export async function upsertUser(profileData: any): Promise<UserProfile> {
  // Extract fields using the same logic as the working old project
  const extractedData = extractProfileFields(profileData);
  const customerId = extractedData.cust_id;
  const displayName = extractedData.display_name || `User ${customerId}`;
  
  if (!customerId) {
    throw new Error('Could not extract customer ID from profile data');
  }
  
  // Check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.iracingCustomerId, customerId))
    .limit(1);
  
  let userId: string;
  
  if (existingUser.length > 0) {
    // Update existing user
    const [updatedUser] = await db
      .update(users)
      .set({
        displayName,
        updatedAt: new Date(),
      })
      .where(eq(users.iracingCustomerId, customerId))
      .returning();
    
    userId = updatedUser.id;
  } else {
    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        iracingCustomerId: customerId,
        displayName,
      })
      .returning();
    
    userId = newUser.id;
  }
  
  // Update license classes if provided
  if (extractedData.licenses && extractedData.licenses.length > 0) {
    await updateUserLicenses(userId, extractedData.licenses);
  }
  
  // Return user profile
  return getUserProfile(userId);
}

/**
 * Update user license information
 */
export async function updateUserLicenses(userId: string, licenses: any[] | any): Promise<void> {
  let licensesArray: any[] = [];
  
  // Handle both array and object formats
  if (Array.isArray(licenses)) {
    licensesArray = licenses;
  } else if (licenses && typeof licenses === 'object') {
    // Convert object format to array (like the OAuth response you're getting)
    licensesArray = Object.values(licenses).filter(license => license && typeof license === 'object');
    console.log('Converted object licenses to array:', licensesArray.length, 'licenses');
  } else {
    console.error('updateUserLicenses called with invalid format:', typeof licenses, licenses);
    return;
  }
  
  if (licensesArray.length === 0) {
    console.warn('updateUserLicenses called with empty license data');
    return;
  }
  
  // Process licenses and group by category to avoid duplicates
  const licenseMap = new Map<string, any>();
  
  licensesArray.forEach(license => {
    console.log('Processing license:', license);
    const category = mapLicenseCategory(license.category_id || license.category);
    // Use group_name instead of license_level for more accurate mapping
    const level = mapLicenseLevelFromGroupName(license.group_name || license.license_level || license.level);
    
    // Use the highest license level if there are duplicates for the same category
    const existing = licenseMap.get(category);
    const currentLicenseLevel = getLicenseNumericValue(level);
    
    if (!existing || getLicenseNumericValue(existing.level) < currentLicenseLevel) {
      licenseMap.set(category, {
        userId,
        category,
        level,
        safetyRating: (parseFloat(license.safety_rating || license.safetyRating || '0')).toString(),
        irating: parseInt(license.irating || license.iRating || '0', 10),
      });
    }
  });
  
  // Ensure all 5 categories are present with at least rookie level
  const requiredCategories = CategoryHelper.getAllCategories();
  
  requiredCategories.forEach(category => {
    if (!licenseMap.has(category)) {
      // Add rookie level license for missing categories
      licenseMap.set(category, {
        userId,
        category,
        level: LicenseLevel.ROOKIE,
        safetyRating: '1.00',
        irating: 1350, // Default rookie iRating
      });
    }
  });
  
  const licenseData = Array.from(licenseMap.values());
  console.log('Final license data to insert:', licenseData);
  
  // Delete existing licenses for this user
  await db.delete(licenseClasses).where(eq(licenseClasses.userId, userId));
  
  // Insert new licenses
  if (licenseData.length > 0) {
    await db.insert(licenseClasses).values(licenseData);
  }
}

/**
 * Get numeric value for license level comparison using centralized helper
 */
function getLicenseNumericValue(level: string): number {
  const normalizedLevel = LicenseHelper.normalize(level);
  return LicenseHelper.getNumericValue(normalizedLevel);
}

/**
 * Store encrypted tokens for user
 */
export async function storeUserTokens(
  userId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }
): Promise<void> {
  const encryptionKey = process.env.SESSION_SECRET;
  if (!encryptionKey) {
    throw new Error('SESSION_SECRET environment variable is required for token encryption');
  }
  
  const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
  
  const encryptedAccessToken = encrypt(tokens.accessToken, encryptionKey);
  const encryptedRefreshToken = encrypt(tokens.refreshToken, encryptionKey);
  
  // Check if account exists
  const existingAccount = await db
    .select()
    .from(iracingAccounts)
    .where(eq(iracingAccounts.userId, userId))
    .limit(1);
  
  if (existingAccount.length > 0) {
    // Update existing accountP
    await db
      .update(iracingAccounts)
      .set({
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        accessTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(iracingAccounts.userId, userId));
  } else {
    // Create new account
    await db
      .insert(iracingAccounts)
      .values({
        userId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        accessTokenExpiresAt: expiresAt,
      });
  }
}

/**
 * Get stored tokens for user
 */
export async function getUserTokens(userId: string): Promise<StoredTokens | null> {
  const account = await db
    .select()
    .from(iracingAccounts)
    .where(eq(iracingAccounts.userId, userId))
    .limit(1);
  
  if (account.length === 0) {
    return null;
  }
  
  const encryptionKey = process.env.SESSION_SECRET;
  if (!encryptionKey) {
    throw new Error('SESSION_SECRET environment variable is required for token decryption');
  }
  
  const accountData = account[0];
  
  try {
    const accessToken = decrypt(accountData.accessToken, encryptionKey);
    const refreshToken = decrypt(accountData.refreshToken, encryptionKey);
    
    return {
      accessToken,
      refreshToken,
      expiresAt: accountData.accessTokenExpiresAt,
    };
  } catch (error) {
    console.error('Failed to decrypt tokens:', error);
    return null;
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (user.length === 0) {
    throw new Error('User not found');
  }
  
  const licenses = await db
    .select()
    .from(licenseClasses)
    .where(eq(licenseClasses.userId, userId));
  
  const userData = user[0];
  
  return {
    id: userData.id,
    iracingCustomerId: userData.iracingCustomerId,
    displayName: userData.displayName,
    licenseClasses: licenses.map(license => ({
      category: license.category,
      level: license.level,
      safetyRating: parseFloat(license.safetyRating),
      iRating: license.irating,
    })),
    createdAt: userData.createdAt!,
    lastSyncAt: userData.lastSyncAt,
  };
}

/**
 * Get user by iRacing customer ID
 */
export async function getUserByIracingId(customerId: number): Promise<UserProfile | null> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.iracingCustomerId, customerId))
    .limit(1);
  
  if (user.length === 0) {
    return null;
  }
  
  return getUserProfile(user[0].id);
}

/**
 * Delete user tokens (for logout)
 */
export async function deleteUserTokens(userId: string): Promise<void> {
  await db.delete(iracingAccounts).where(eq(iracingAccounts.userId, userId));
}

/**
 * Map iRacing license category ID to Category enum
 */
export function mapLicenseCategory(categoryId: number | string): Category {
  const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
  switch (id) {
    case 1: return Category.OVAL;
    case 2: return Category.SPORTS_CAR; // Legacy road -> sports_car
    case 3: return Category.DIRT_OVAL;
    case 4: return Category.DIRT_ROAD;
    case 5: return Category.SPORTS_CAR; // Sports Car
    case 6: return Category.FORMULA_CAR; // Formula Car
    default: 
      // Handle string categories directly
      if (typeof categoryId === 'string') {
        return CategoryHelper.normalize(categoryId);
      }
      console.warn('Unknown license category:', categoryId);
      return Category.SPORTS_CAR; // Default to sports_car
  }
}

/**
 * Map iRacing license level from group_name to string using centralized helper
 */
export function mapLicenseLevelFromGroupName(groupName: string | number): string {
  // If it's a number, use the license helper directly
  if (typeof groupName === 'number') {
    return LicenseHelper.fromIRacingGroup(groupName);
  }
  
  if (typeof groupName !== 'string') {
    console.warn('Invalid group_name type:', typeof groupName, groupName);
    return LicenseLevel.ROOKIE;
  }
  
  // Use the centralized license helper for normalization
  return LicenseHelper.normalize(groupName);
}