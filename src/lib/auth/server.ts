// Server-side auth utilities
// This module exports functions that can only be used in server components or API routes

// OAuth utilities
export {
  generatePKCEChallenge,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  fetchUserProfile,
  IRACING_OAUTH_CONFIG,
} from './oauth';

// Database utilities
export {
  upsertUser,
  updateUserLicenses,
  storeUserTokens,
  getUserTokens,
  getUserProfile,
  getUserByIracingId,
  deleteUserTokens,
} from './db';

// Session management (server-side only)
export {
  createSessionToken,
  verifySessionToken,
  setSessionCookie,
  getSession,
  clearSessionCookie,
} from './session';

// Token refresh
export {
  refreshUserTokens,
  getValidAccessToken,
} from './refresh';

// Profile management
export {
  fetchFreshUserProfile,
  syncUserLicenses,
} from './profile';

// Middleware
export {
  withAuth,
  withAuthAndProfile,
  getUserFromHeaders,
  isAuthenticated,
} from './middleware';

// Crypto utilities
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  encrypt,
  decrypt,
} from './crypto';

// Types
export type { UserProfile, StoredTokens } from './db';
export type { SessionData } from './session';
export type { OAuthConfig, PKCEChallenge, TokenResponse } from './oauth';
export type { User, AuthState } from './hooks';