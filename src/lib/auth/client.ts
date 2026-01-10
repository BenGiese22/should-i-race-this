// Client-side auth utilities
// This module only exports functions safe for client-side use

export { useAuth } from './hooks';
export type { User, AuthState } from './hooks';

// Re-export crypto utilities (safe for client-side)
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  encrypt,
  decrypt,
} from './crypto';

// Re-export OAuth config (safe for client-side)
export {
  IRACING_OAUTH_CONFIG,
} from './oauth';

// Re-export types (safe for client-side)
export type { UserProfile, StoredTokens } from './db';
export type { OAuthConfig, PKCEChallenge, TokenResponse } from './oauth';