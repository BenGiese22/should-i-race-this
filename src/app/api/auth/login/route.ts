import { NextResponse } from "next/server";
import { pkceChallengeFromVerifier, randomUrlSafeString } from "@/lib/oauth/pkce";
import { signJson, TRANSIENT_COOKIE } from "@/lib/auth/signedCookie";

export const runtime = "nodejs";

const OAUTH_BASE = "https://oauth.iracing.com/oauth2";

export async function GET() {
  const clientId = process.env.IRACING_CLIENT_ID;
  const redirectUri = process.env.IRACING_REDIRECT_URI;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !redirectUri || !sessionSecret) {
    return NextResponse.json(
      { error: "Missing IRACING_CLIENT_ID, IRACING_REDIRECT_URI, or SESSION_SECRET" },
      { status: 500 }
    );
  }

  const state = randomUrlSafeString(24);
  const codeVerifier = randomUrlSafeString(64);
  const codeChallenge = pkceChallengeFromVerifier(codeVerifier);

  // minimal scopes for smoke test
  const scope = "iracing.profile iracing.auth";

  const cookieValue = signJson(
    { state, codeVerifier, createdAt: Date.now() },
    sessionSecret
  );

  const authorizeUrl =
    `${OAUTH_BASE}/authorize?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256`;

  const res = NextResponse.redirect(authorizeUrl);

  res.cookies.set(TRANSIENT_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return res;
}
