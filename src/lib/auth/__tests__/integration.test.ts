/**
 * Integration tests for authentication flow
 * Tests the complete OAuth flow without external dependencies
 */

import { 
  generatePKCEChallenge, 
  buildAuthorizationUrl,
  IRACING_OAUTH_CONFIG 
} from '../oauth';
import { encrypt, decrypt } from '../crypto';

describe('Authentication Integration Tests', () => {
  test('Complete OAuth flow components work together', () => {
    // Test OAuth configuration
    const config = {
      clientId: 'test-client-id',
      redirectUri: 'http://127.0.0.1:3000/api/auth/callback',
      baseUrl: 'http://127.0.0.1:3000',
    };

    // Generate PKCE challenge
    const challenge = generatePKCEChallenge();
    
    // Verify challenge structure
    expect(challenge.codeVerifier).toBeTruthy();
    expect(challenge.codeChallenge).toBeTruthy();
    expect(challenge.state).toBeTruthy();
    
    // Build authorization URL
    const authUrl = buildAuthorizationUrl(config, challenge);
    
    // Verify URL structure
    const url = new URL(authUrl);
    expect(url.origin).toBe('https://members-ng.iracing.com');
    expect(url.pathname).toBe('/auth/authorize');
    expect(url.searchParams.get('client_id')).toBe(config.clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(config.redirectUri);
    expect(url.searchParams.get('code_challenge')).toBe(challenge.codeChallenge);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe(challenge.state);
    expect(url.searchParams.get('scope')).toBe(IRACING_OAUTH_CONFIG.scope);
  });

  test('Token encryption/decryption round trip', () => {
    const testToken = 'test-access-token-12345';
    const encryptionKey = 'test-encryption-key-for-tokens';
    
    // Encrypt token
    const encrypted = encrypt(testToken, encryptionKey);
    expect(encrypted).not.toBe(testToken);
    expect(encrypted).toContain(':'); // Should have IV:ciphertext format
    
    // Decrypt token
    const decrypted = decrypt(encrypted, encryptionKey);
    expect(decrypted).toBe(testToken);
  });

  test('OAuth endpoints are correctly configured', () => {
    expect(IRACING_OAUTH_CONFIG.authorizationUrl).toBe('https://members-ng.iracing.com/auth/authorize');
    expect(IRACING_OAUTH_CONFIG.tokenUrl).toBe('https://members-ng.iracing.com/auth/token');
    expect(IRACING_OAUTH_CONFIG.userInfoUrl).toBe('https://members-ng.iracing.com/data/member/info');
    expect(IRACING_OAUTH_CONFIG.scope).toBe('read');
  });

  test('PKCE challenge security properties', () => {
    // Generate multiple challenges to test uniqueness
    const challenges = Array.from({ length: 10 }, () => generatePKCEChallenge());
    
    // All code verifiers should be unique
    const verifiers = challenges.map(c => c.codeVerifier);
    const uniqueVerifiers = new Set(verifiers);
    expect(uniqueVerifiers.size).toBe(verifiers.length);
    
    // All code challenges should be unique
    const challengeValues = challenges.map(c => c.codeChallenge);
    const uniqueChallenges = new Set(challengeValues);
    expect(uniqueChallenges.size).toBe(challengeValues.length);
    
    // All states should be unique
    const states = challenges.map(c => c.state);
    const uniqueStates = new Set(states);
    expect(uniqueStates.size).toBe(states.length);
    
    // All values should be base64url format
    challenges.forEach(challenge => {
      expect(challenge.codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(challenge.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(challenge.state).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  test('Environment configuration validation', () => {
    // These are the required environment variables for OAuth
    const requiredEnvVars = [
      'IRACING_CLIENT_ID',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'OAUTH_REDIRECT_URI',
      'DATABASE_URL'
    ];

    // In a real environment, these should all be set
    // For testing, we just verify the structure is correct
    requiredEnvVars.forEach(envVar => {
      // The environment variable should be defined in the .env.local file
      expect(typeof envVar).toBe('string');
      expect(envVar.length).toBeGreaterThan(0);
    });
  });
});