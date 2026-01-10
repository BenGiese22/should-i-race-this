import { getValidAccessToken } from './refresh';
import { updateUserLicenses } from './db';
import { makeAuthenticatedRequest } from '../iracing/client';

/**
 * Fetch fresh user profile data from iRacing API using the same authenticated request pattern
 */
export async function fetchFreshUserProfile(userId: string): Promise<any> {
  try {
    // According to the API docs, /member/get with include_licenses=true is the correct endpoint
    // But it requires cust_ids parameter, so we'll use /member/info for basic profile
    // and then try to get licenses separately if needed
    
    // First try: Get basic profile info (always works for authenticated user)
    const profileData = await makeAuthenticatedRequest(
      userId,
      '/member/info',
      {}
    ) as any;
    
    // Try to get licenses using the profile endpoint that includes licenses
    try {
      const profileWithLicenses = await makeAuthenticatedRequest(
        userId,
        '/member/profile',
        {}
      ) as any;
      
      // Merge license data if available
      if (profileWithLicenses.licenses) {
        profileData.licenses = profileWithLicenses.licenses;
      }
    } catch (error) {
      console.warn('Could not fetch licenses from profile endpoint, trying member/get...');
      
      // Fallback: Try member/get with the user's customer ID if we have it
      if (profileData.cust_id) {
        try {
          const memberData = await makeAuthenticatedRequest(
            userId,
            '/member/get',
            { 
              cust_ids: profileData.cust_id,
              include_licenses: true 
            }
          );
          
          // memberData should be an array, take the first item
          if (Array.isArray(memberData) && memberData.length > 0 && memberData[0].licenses) {
            profileData.licenses = memberData[0].licenses;
          }
        } catch (memberError) {
          console.warn('Could not fetch licenses from member/get endpoint either');
        }
      }
    }
    
    // Update license information in database if available
    if (profileData.licenses) {
      // Handle different license data formats
      let licensesArray = [];
      if (Array.isArray(profileData.licenses)) {
        licensesArray = profileData.licenses;
      } else if (typeof profileData.licenses === 'object') {
        // If licenses is an object, convert to array format
        // iRacing sometimes returns licenses as an object with category keys
        licensesArray = Object.values(profileData.licenses).filter(license => license && typeof license === 'object');
      }
      
      if (licensesArray.length > 0) {
        await updateUserLicenses(userId, licensesArray);
        console.log(`Updated ${licensesArray.length} licenses for user`);
      }
    }
    
    return profileData;
  } catch (error) {
    console.error('Failed to fetch fresh user profile:', error);
    throw error;
  }
}

/**
 * Sync user license levels from iRacing
 */
export async function syncUserLicenses(userId: string): Promise<void> {
  try {
    const profileData = await fetchFreshUserProfile(userId);
    
    if (profileData.licenses) {
      await updateUserLicenses(userId, profileData.licenses);
    }
  } catch (error) {
    console.error('Failed to sync user licenses:', error);
    throw error;
  }
}