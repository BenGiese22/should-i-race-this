import { generateCodeVerifier, generateCodeChallenge, generateState } from './crypto';

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  baseUrl: string;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * iRacing OAuth2 endpoints and configuration
 * Using the stable oauth.iracing.com endpoints instead of members-ng.iracing.com
 * to avoid React SPA rendering issues
 */
export const IRACING_OAUTH_CONFIG = {
  authorizationUrl: 'https://oauth.iracing.com/oauth2/authorize',
  tokenUrl: 'https://oauth.iracing.com/oauth2/token',
  userInfoUrl: 'https://oauth.iracing.com/oauth2/iracing/profile',
  scope: 'iracing.profile iracing.auth',
} as const;

/**
 * Generate PKCE challenge for OAuth flow
 */
export function generatePKCEChallenge(): PKCEChallenge {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();
  
  return {
    codeVerifier,
    codeChallenge,
    state,
  };
}

/**
 * Build authorization URL for iRacing OAuth
 */
export function buildAuthorizationUrl(config: OAuthConfig, challenge: PKCEChallenge): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: IRACING_OAUTH_CONFIG.scope,
    code_challenge: challenge.codeChallenge,
    code_challenge_method: 'S256',
    state: challenge.state,
  });
  
  return `${IRACING_OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * Note: iRacing OAuth may not require client_secret for public clients
 */
export async function exchangeCodeForToken(
  config: OAuthConfig,
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  // Only add client_secret if it's provided (not required for all iRacing OAuth apps)
  const clientSecret = process.env.IRACING_CLIENT_SECRET;
  if (clientSecret) {
    tokenParams.append('client_secret', clientSecret);
  }

  const response = await fetch(IRACING_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

/**
 * Refresh access token using refresh token
 * Note: iRacing OAuth may not require client_secret for public clients
 */
export async function refreshAccessToken(
  clientId: string,
  refreshToken: string
): Promise<TokenResponse> {
  const tokenParams = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  });

  // Only add client_secret if it's provided (not required for all iRacing OAuth apps)
  const clientSecret = process.env.IRACING_CLIENT_SECRET;
  if (clientSecret) {
    tokenParams.append('client_secret', clientSecret);
  }

  const response = await fetch(IRACING_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

/**
 * Fetch user profile from iRacing API
 */
export async function fetchUserProfile(accessToken: string): Promise<any> {
  const response = await fetch(IRACING_OAUTH_CONFIG.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`User profile fetch failed: ${response.status} ${errorText}`);
  }
  
  return response.json();
}