import { NextRequest, NextResponse } from "next/server";
import { verifyJson, TRANSIENT_COOKIE } from "@/lib/auth/signedCookie";

export const runtime = "nodejs";

const OAUTH_BASE = "https://oauth.iracing.com/oauth2";

type Transient = { state: string; codeVerifier: string; createdAt: number };

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return NextResponse.json(
      { error, error_description: errorDescription ?? null },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code/state" }, { status: 400 });
  }

  const clientId = process.env.IRACING_CLIENT_ID;
  // const redirectUri = process.env.IRACING_REDIRECT_URI;
  const redirectUri = new URL(req.url);
  const clientSecret = process.env.IRACING_CLIENT_SECRET || "";
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !redirectUri || !sessionSecret) {
    return NextResponse.json(
      { error: "Missing IRACING_CLIENT_ID, IRACING_REDIRECT_URI, or SESSION_SECRET" },
      { status: 500 }
    );
  }

  const transientCookie = req.cookies.get(TRANSIENT_COOKIE)?.value;
  if (!transientCookie) {
    return NextResponse.json({ error: "Missing transient cookie" }, { status: 400 });
  }

  const transient = verifyJson<Transient>(transientCookie, sessionSecret);
  if (!transient) {
    return NextResponse.json({ error: "Invalid transient cookie" }, { status: 400 });
  }

  if (transient.state !== state) {
    return NextResponse.json({ error: "State mismatch" }, { status: 400 });
  }

  // Exchange authorization code for tokens
  const form = new URLSearchParams();
  form.set("grant_type", "authorization_code");
  form.set("client_id", clientId);
  form.set("redirect_uri", redirectUri.toString());
  form.set("code", code);
  form.set("code_verifier", transient.codeVerifier);
  if (clientSecret) form.set("client_secret", clientSecret);

  const tokenResp = await fetch(`${OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const tokens: any = await tokenResp.json();
  if (!tokenResp.ok) {
    return NextResponse.json(
      { error: "token_exchange_failed", details: tokens },
      { status: 400 }
    );
  }

  // Smoke test: fetch profile using access token
  const profileResp = await fetch(`${OAUTH_BASE}/iracing/profile`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const profile = await profileResp.json();

  const res = NextResponse.json({ ok: true, profile }, { status: 200 });

  // clear transient cookie
  res.cookies.set(TRANSIENT_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
