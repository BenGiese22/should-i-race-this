import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { UserProfile } from './db';

const SESSION_COOKIE_NAME = 'racing-session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface SessionData {
  userId: string;
  iracingCustomerId: number;
  displayName: string;
  expiresAt: number;
}

/**
 * Create a signed session token
 */
export async function createSessionToken(user: UserProfile): Promise<string> {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
  const expiresAt = Date.now() + SESSION_DURATION;
  
  const token = await new SignJWT({
    userId: user.id,
    iracingCustomerId: user.iracingCustomerId,
    displayName: user.displayName,
    expiresAt,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(new Date(expiresAt))
    .sign(secret);
  
  return token;
}

/**
 * Verify and decode session token
 */
export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    const sessionData = payload as unknown as SessionData;
    
    // Check if token is expired
    if (Date.now() > sessionData.expiresAt) {
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Session token verification failed:', error);
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(user: UserProfile): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  });
}

/**
 * Get session from cookie
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return verifySessionToken(token);
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}