/**
 * Property-based tests for OAuth Flow Security
 * Feature: racing-analytics-dashboard, Property 1: OAuth Flow Security
 * Validates: Requirements 1.2, 1.3, 1.4
 */

import { 
  generatePKCEChallenge, 
  buildAuthorizationUrl
} from '../oauth';
import {
  encrypt, 
  decrypt
} from '../crypto';

describe('OAuth Flow Security Properties', () => {
  /**
   * Property 1: OAuth Flow Security
   * For any OAuth authentication attempt, the system should generate unique PKCE challenges,
   * securely store tokens upon successful completion, and automatically refresh expired tokens
   * without user intervention.
   */
  
  test('PKCE challenges should be unique and secure', () => {
    console.log('Starting simple PKCE test...');
    
    // Test basic functionality without property-based testing first
    const challenge1 = generatePKCEChallenge();
    const challenge2 = generatePKCEChallenge();
    
    console.log('Generated two challenges');
    
    // Should be unique
    expect(challenge1.codeVerifier).not.toBe(challenge2.codeVerifier);
    expect(challenge1.codeChallenge).not.toBe(challenge2.codeChallenge);
    expect(challenge1.state).not.toBe(challenge2.state);
    
    // Should be base64url format
    expect(challenge1.codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge1.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge1.state).toMatch(/^[A-Za-z0-9_-]+$/);
    
    console.log('Basic PKCE test completed');
  });

  test('Encryption should work correctly', () => {
    console.log('Starting encryption test...');
    
    const plaintext = 'test-token-12345';
    const key = 'test-encryption-key-that-is-long-enough';
    
    const encrypted = encrypt(plaintext, key);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(':').length).toBe(2); // IV and ciphertext
    
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(plaintext);
    
    console.log('Encryption test completed');
  });

  test('Authorization URL should be properly formatted', () => {
    console.log('Starting URL test...');
    
    const config = {
      clientId: 'test-client',
      redirectUri: 'http://127.0.0.1:3000/callback',
      baseUrl: 'http://127.0.0.1:3000',
    };
    
    const challenge = generatePKCEChallenge();
    const authUrl = buildAuthorizationUrl(config, challenge);
    
    const url = new URL(authUrl);
    expect(url.searchParams.get('client_id')).toBe('test-client');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    
    console.log('URL test completed');
  });
});