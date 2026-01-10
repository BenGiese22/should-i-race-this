import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generatePKCEChallenge, buildAuthorizationUrl } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== OAuth Login Route Hit ===');
    
    // Get configuration from environment
    const clientId = process.env.IRACING_CLIENT_ID;
    
    console.log('OAuth Config:', { clientId });
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'OAuth configuration missing' },
        { status: 500 }
      );
    }
    
    // Build redirect URI using 127.0.0.1 to match iRacing OAuth app configuration
    const requestUrl = new URL(request.url);
    const port = requestUrl.port || '3000';
    // Force 127.0.0.1 like the working old project to ensure OAuth compatibility
    const hostname = requestUrl.hostname === 'localhost' ? '127.0.0.1' : requestUrl.hostname;
    const redirectUri = `${requestUrl.protocol}//${hostname}:${port}/oauth/callback`;
    const baseUrl = `${requestUrl.protocol}//${hostname}:${port}`;
    
    console.log('Request hostname:', requestUrl.hostname);
    console.log('Forced hostname:', hostname);
    console.log('Consistent redirect URI:', redirectUri);
    
    // Generate PKCE challenge
    const challenge = generatePKCEChallenge();
    
    console.log('Generated PKCE challenge:', { 
      hasCodeVerifier: !!challenge.codeVerifier,
      hasCodeChallenge: !!challenge.codeChallenge,
      hasState: !!challenge.state 
    });
    
    // Store PKCE data in secure cookies for callback verification
    const cookieStore = await cookies();
    
    // Set transient cookies for OAuth flow (short-lived)
    // Using consistent 127.0.0.1 domain for OAuth compatibility
    cookieStore.set('oauth_code_verifier', challenge.codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
      domain: undefined, // Let browser handle domain
    });
    
    cookieStore.set('oauth_state', challenge.state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
      domain: undefined, // Let browser handle domain
    });
    
    console.log('PKCE cookies set');
    
    // Build authorization URL
    const authUrl = buildAuthorizationUrl(
      {
        clientId,
        redirectUri,
        baseUrl,
      },
      challenge
    );
    
    console.log('Authorization URL:', authUrl);
    
    // Redirect to iRacing OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth login error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}