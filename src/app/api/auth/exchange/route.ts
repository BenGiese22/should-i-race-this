import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  fetchProfile,
  TokenResponse,
} from "@/lib/auth/iracingOAuth";
import {
  SESSION_COOKIE,
  signJson,
  TRANSIENT_COOKIE,
  verifyJson,
} from "@/lib/auth/signedCookie";
import { prisma } from "@/server/db/prisma";
import { ingestMember } from "@/server/ingest/member";
import { ingestCatalog } from "@/server/ingest/catalog";
import { ingestSchedule } from "@/server/ingest/schedule";
import { ingestMemberStats } from "@/server/ingest/memberStats";

export const runtime = "nodejs";

type Transient = { state: string; codeVerifier: string; createdAt: number };
type Session = {
  iracing_cust_id: string | number;
  iracing_name: string;
  expiresAt: number;
};

const TRANSIENT_TTL_MS = 10 * 60 * 1000;

function buildRedirectUri(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const host =
    requestUrl.hostname === "localhost" ? "127.0.0.1" : requestUrl.hostname;
  const origin = `${requestUrl.protocol}//${host}${requestUrl.port ? `:${requestUrl.port}` : ""}`;
  return new URL("/oauth/callback", origin).toString();
}

function extractProfileFields(profile: any) {
  const candidates = [
    profile,
    profile?.data,
    profile?.profile,
    profile?.customer,
    profile?.member,
    Array.isArray(profile?.data) ? profile.data[0] : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const iracingCustId =
      candidate?.cust_id ??
      candidate?.iracing_cust_id ??
      candidate?.iracing_custId ??
      candidate?.customer_id ??
      candidate?.user_id ??
      candidate?.iracing_cust_id ??
      candidate?.id ??
      null;
    const iracingName =
      candidate?.display_name ??
      candidate?.name ??
      candidate?.cust_name ??
      candidate?.iracing_name ??
      candidate?.full_name ??
      null;

    if (iracingCustId && iracingName) {
      return { iracingCustId, iracingName };
    }
  }

  return { iracingCustId: null, iracingName: null };
}

export async function POST(req: NextRequest) {
  const clientId = process.env.IRACING_CLIENT_ID;
  const clientSecret = process.env.IRACING_CLIENT_SECRET || "";
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !sessionSecret) {
    return NextResponse.json(
      { error: "Missing IRACING_CLIENT_ID or SESSION_SECRET" },
      { status: 500 }
    );
  }

  let body: { code?: string; state?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = body.code;
  const state = body.state;
  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
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

  if (Date.now() - transient.createdAt > TRANSIENT_TTL_MS) {
    return NextResponse.json({ error: "State expired" }, { status: 400 });
  }

  const redirectUri = buildRedirectUri(req);
  const tokenResp = await exchangeCodeForTokens({
    clientId,
    clientSecret,
    redirectUri,
    code,
    codeVerifier: transient.codeVerifier,
  });

  if (!tokenResp.ok) {
    return NextResponse.json(
      { error: "token_exchange_failed", details: tokenResp.data },
      { status: 400 }
    );
  }

  const tokens = tokenResp.data as TokenResponse;
  if (!tokens?.access_token) {
    return NextResponse.json(
      { error: "token_exchange_failed", details: tokenResp.data },
      { status: 400 }
    );
  }

  const profileResp = await fetchProfile(tokens.access_token);
  if (!profileResp.ok) {
    return NextResponse.json(
      { error: "profile_fetch_failed", details: profileResp.data },
      { status: 400 }
    );
  }

  const { iracingCustId, iracingName } = extractProfileFields(profileResp.data);
  if (!iracingCustId || !iracingName) {
    return NextResponse.json(
      { error: "profile_missing_fields", details: profileResp.data },
      { status: 400 }
    );
  }

  const expiresIn = tokens.expires_in ?? 3600;
  const expiresAt = Date.now() + expiresIn * 1000;
  const custId = Number(iracingCustId);
  if (!Number.isFinite(custId)) {
    return NextResponse.json(
      { error: "Invalid cust_id from profile", details: profileResp.data },
      { status: 400 }
    );
  }

  const user = await prisma.user.upsert({
    where: { iracingCustId: custId },
    update: {},
    create: { iracingCustId: custId },
  });

  await prisma.iRacingAccount.upsert({
    where: { custId },
    update: {
      userId: user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      accessTokenExpiresAt: new Date(expiresAt),
    },
    create: {
      userId: user.id,
      custId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      accessTokenExpiresAt: new Date(expiresAt),
    },
  });

  try {
    const account = await prisma.iRacingAccount.findUnique({ where: { custId } });
    if (account) {
      await ingestCatalog(account, { series: true, tracks: true });
      await ingestSchedule(account);
      await ingestMember(account, custId);
      await ingestMemberStats(account, custId);
    }
  } catch {
    // Best-effort member ingest to seed license data.
  }

  const sessionPayload: Session = {
    iracing_cust_id: custId,
    iracing_name: String(iracingName),
    expiresAt,
  };

  const cookieValue = signJson(sessionPayload, sessionSecret);
  const res = NextResponse.json({ ok: true });

  res.cookies.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(1, Math.floor(expiresIn)),
  });

  res.cookies.set(TRANSIENT_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
