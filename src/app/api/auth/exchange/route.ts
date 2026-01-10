import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, fetchUserProfile } from '@/lib/auth/server';
import { upsertUser, storeUserTokens } from '@/lib/auth/server';
import { setSessionCookie, syncUserLicenses } from '@/lib/auth/server';
import { syncScheduleData } from '@/lib/iracing/schedule';
import { syncUserRaceData } from '@/lib/iracing/sync';

export async function POST(request: NextRequest) {
  console.log('=== OAuth Exchange Route Hit ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Parse request body
    let body: { code?: string; state?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const code = body.code;
    const state = body.state;
    
    console.log('Exchange request:', { code: !!code, state: !!state });
    
    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    // Get stored PKCE data from cookies
    const cookieStore = await cookies();
    const storedCodeVerifier = cookieStore.get('oauth_code_verifier')?.value;
    const storedState = cookieStore.get('oauth_state')?.value;
    
    console.log('PKCE data from cookies:', { 
      hasCodeVerifier: !!storedCodeVerifier, 
      hasState: !!storedState 
    });
    
    if (!storedCodeVerifier || !storedState) {
      console.error('Missing OAuth data in cookies');
      return NextResponse.json({ error: "Missing OAuth data in cookies" }, { status: 400 });
    }
    
    // Verify state parameter (CSRF protection)
    if (state !== storedState) {
      console.error('State mismatch:', { received: state, stored: storedState });
      return NextResponse.json({ error: "State mismatch" }, { status: 400 });
    }
    
    // Get configuration
    const clientId = process.env.IRACING_CLIENT_ID;
    
    if (!clientId) {
      console.error('Missing OAuth configuration');
      return NextResponse.json({ error: "Missing OAuth configuration" }, { status: 500 });
    }
    
    // Build redirect URI using the same logic as login route
    const requestUrl = new URL(request.url);
    const port = requestUrl.port || '3000';
    const hostname = requestUrl.hostname === 'localhost' ? '127.0.0.1' : requestUrl.hostname;
    const redirectUri = `${requestUrl.protocol}//${hostname}:${port}/oauth/callback`;
    
    console.log('Using redirect URI:', redirectUri);
    console.log('Starting token exchange...');
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(
      {
        clientId,
        redirectUri,
        baseUrl: `${requestUrl.protocol}//${hostname}:${port}`,
      },
      code,
      storedCodeVerifier
    );
    
    console.log('Token exchange successful, fetching user profile...');
    
    // Fetch user profile from iRacing
    const profileData = await fetchUserProfile(tokens.access_token);
    
    console.log('User profile fetched successfully');
    
    console.log('Creating/updating user in database...');
    
    // Create or update user in database
    const user = await upsertUser(profileData);
    
    console.log('User created/updated:', { userId: user.id });
    
    // Store encrypted tokens
    await storeUserTokens(user.id, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
    
    console.log('Tokens stored, setting session cookie...');
    
    // Set session cookie
    await setSessionCookie(user);
    
    // Clear OAuth cookies
    cookieStore.delete('oauth_code_verifier');
    cookieStore.delete('oauth_state');
    
    console.log('Starting background data sync...');
    
    // Sync user data in the background (don't wait for completion to avoid timeout)
    // This ensures the user gets the essential data needed for recommendations
    Promise.all([
      // Sync license data (essential for recommendations)
      syncUserLicenses(user.id).catch(error => 
        console.error('License sync failed during login:', error)
      ),
      
      // Sync current season schedule (essential for recommendations)
      syncScheduleData(user.id).catch(error => 
        console.error('Schedule sync failed during login:', error)
      ),
      
      // Sync recent race data (can be done later if needed)
      syncUserRaceData(user.id, user.iracingCustomerId).catch(error => 
        console.error('Race data sync failed during login:', error)
      ),
    ]).then(() => {
      console.log('Background data sync completed successfully');
    }).catch(error => {
      console.error('Background data sync had errors:', error);
    });
    
    console.log('OAuth exchange completed successfully');
    
    // Return success response (like the working old project)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('=== OAuth exchange error ===');
    console.error('Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "token_exchange_failed", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}