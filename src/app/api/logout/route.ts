import { NextRequest, NextResponse } from "next/server";
import { revokeToken } from "@/lib/auth/iracingOAuth";
import { SESSION_COOKIE, verifyJson } from "@/lib/auth/signedCookie";

export const runtime = "nodejs";

type Session = {
  accessToken?: string;
};

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

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (sessionCookie) {
    const session = verifyJson<Session>(sessionCookie, sessionSecret);
    if (session?.accessToken) {
      try {
        await revokeToken({
          clientId,
          clientSecret,
          token: session.accessToken,
        });
      } catch {
        // Best-effort revoke; continue logout.
      }
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
