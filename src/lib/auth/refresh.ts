import { refreshAccessToken } from './oauth';
import { getUserTokens, storeUserTokens } from './db';

/**
 * Refresh user tokens if they are expired or about to expire
 */
export async function refreshUserTokens(userId: string): Promise<boolean> {
  try {
    const tokens = await getUserTokens(userId);
    
    if (!tokens) {
      return false;
    }
    
    // Check if token is expired or expires within 5 minutes
    const expirationBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    const isExpired = Date.now() >= (tokens.expiresAt.getTime() - expirationBuffer);
    
    if (!isExpired) {
      return true; // Token is still valid
    }
    
    // Refresh the token
    const clientId = process.env.IRACING_CLIENT_ID;
    if (!clientId) {
      throw new Error('IRACING_CLIENT_ID not configured');
    }
    
    const newTokens = await refreshAccessToken(clientId, tokens.refreshToken);
    
    // Store the new tokens
    await storeUserTokens(userId, {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token,
      expiresIn: newTokens.expires_in,
    });
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

/**
 * Get valid access token for user, refreshing if necessary
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const refreshed = await refreshUserTokens(userId);
  
  if (!refreshed) {
    return null;
  }
  
  const tokens = await getUserTokens(userId);
  return tokens?.accessToken || null;
}