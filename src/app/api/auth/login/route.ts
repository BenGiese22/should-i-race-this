import { NextRequest, NextResponse } from "next/server";
import { pkceChallengeFromVerifier, randomUrlSafeString } from "@/lib/auth/pkce";
import { buildAuthorizeUrl } from "@/lib/auth/iracingOAuth";
import { signJson, TRANSIENT_COOKIE } from "@/lib/auth/signedCookie";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const clientId = process.env.IRACING_CLIENT_ID;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !sessionSecret) {
    return NextResponse.json(
      { error: "Missing IRACING_CLIENT_ID or SESSION_SECRET" },
      { status: 500 }
    );
  }

  const requestUrl = new URL(req.url);
  const host =
    requestUrl.hostname === "localhost" ? "127.0.0.1" : requestUrl.hostname;
  const origin = `${requestUrl.protocol}//${host}${requestUrl.port ? `:${requestUrl.port}` : ""}`;
  const redirectUri = new URL("/oauth/callback", origin).toString();
  const state = randomUrlSafeString(24);
  const codeVerifier = randomUrlSafeString(64);
  const codeChallenge = pkceChallengeFromVerifier(codeVerifier);

  // minimal scopes for smoke test
  const scope = "iracing.profile iracing.auth";

  const cookieValue = signJson(
    { state, codeVerifier, createdAt: Date.now() },
    sessionSecret
  );

  const authorizeUrl = buildAuthorizeUrl({
    clientId,
    redirectUri,
    scope,
    state,
    codeChallenge,
  });

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
