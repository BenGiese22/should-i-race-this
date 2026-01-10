import crypto from 'crypto';

/**
 * Generate a cryptographically secure random string for PKCE code verifier
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge from verifier using SHA256
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Generate a secure random state parameter for OAuth flow
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Encrypt sensitive data for secure storage
 */
export function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  
  // Create a key from the provided string
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data from secure storage
 */
export function decrypt(encryptedText: string, key: string): string {
  const algorithm = 'aes-256-cbc';
  const parts = encryptedText.split(':');
  
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  // Create a key from the provided string
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}