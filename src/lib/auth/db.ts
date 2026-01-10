import { db } from '../db';
import { users, iracingAccounts, licenseClasses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from './crypto';

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
export async function updateUserLicenses(userId: string, licenses: any[]): Promise<void> {
  if (!Array.isArray(licenses)) {
    console.error('updateUserLicenses called with non-array:', typeof licenses, licenses);
    return;
  }
  
  if (licenses.length === 0) {
    console.warn('updateUserLicenses called with empty array');
    return;
  }
  
  // Process licenses and group by category to avoid duplicates
  const licenseMap = new Map<string, any>();
  
  licenses.forEach(license => {
    console.log('Processing license:', license);
    const category = mapLicenseCategory(license.category_id || license.category);
    const level = mapLicenseLevel(license.license_level || license.level);
    
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
  const requiredCategories = ['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road'];
  
  requiredCategories.forEach(category => {
    if (!licenseMap.has(category)) {
      // Add rookie level license for missing categories
      licenseMap.set(category, {
        userId,
        category,
        level: 'rookie',
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
 * Get numeric value for license level comparison
 */
function getLicenseNumericValue(level: string): number {
  switch (level.toLowerCase()) {
    case 'rookie': return 1;
    case 'd': return 2;
    case 'c': return 3;
    case 'b': return 4;
    case 'a': return 5;
    case 'pro': return 6;
    default: return 1;
  }
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
  const encryptionKey = process.env.NEXTAUTH_SECRET!;
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
    // Update existing account
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
  
  const encryptionKey = process.env.NEXTAUTH_SECRET!;
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
 * Map iRacing license category ID to string
 */
export function mapLicenseCategory(categoryId: number | string): string {
  const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
  switch (id) {
    case 1: return 'oval';
    case 2: return 'sports_car'; // Legacy road -> sports_car
    case 3: return 'dirt_oval';
    case 4: return 'dirt_road';
    case 5: return 'sports_car'; // Sports Car
    case 6: return 'formula_car'; // Formula Car
    default: 
      // Handle string categories directly
      if (typeof categoryId === 'string') {
        const lower = categoryId.toLowerCase();
        if (['oval', 'sports_car', 'formula_car', 'dirt_oval', 'dirt_road'].includes(lower)) {
          return lower;
        }
        // Map specific category names
        if (lower.includes('sports')) {
          return 'sports_car';
        }
        if (lower.includes('formula')) {
          return 'formula_car';
        }
        // Legacy road mapping
        if (lower === 'road') {
          return 'sports_car'; // Default road to sports_car
        }
      }
      console.warn('Unknown license category:', categoryId);
      return 'sports_car'; // Default to sports_car instead of road
  }
}

/**
 * Map iRacing license level to string
 */
function mapLicenseLevel(level: number | string): string {
  const lvl = typeof level === 'string' ? parseInt(level, 10) : level;
  
  // Handle the actual iRacing license level mapping
  // iRacing uses different numbering: 1=Rookie, 2=D, 6=C, 10=B, 14=A, 18=Pro
  switch (lvl) {
    case 1: return 'rookie';
    case 2: return 'D';
    case 6: return 'C';
    case 10: return 'B';
    case 14: return 'A';
    case 18: return 'pro';
    default:
      // Handle string levels directly
      if (typeof level === 'string') {
        const lower = level.toLowerCase();
        if (['rookie', 'd', 'c', 'b', 'a', 'pro'].includes(lower)) {
          return lower === 'rookie' ? 'rookie' : level.toUpperCase();
        }
      }
      console.warn('Unknown license level:', level);
      return 'rookie';
  }
}