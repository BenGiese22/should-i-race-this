// Main auth module - exports only universally safe utilities
// For client-side use: import from '@/lib/auth/client'
// For server-side use: import from '@/lib/auth/server'

// Crypto utilities (safe everywhere)
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  encrypt,
  decrypt,
} from './crypto';

// OAuth config (safe everywhere)
export {
  IRACING_OAUTH_CONFIG,
} from './oauth';

// Types (safe everywhere)
export type { UserProfile, StoredTokens } from './db';
export type { SessionData } from './session';
export type { OAuthConfig, PKCEChallenge, TokenResponse } from './oauth';
export type { User, AuthState } from './hooks';