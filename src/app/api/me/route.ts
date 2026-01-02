import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyJson } from "@/lib/auth/signedCookie";

export const runtime = "nodejs";

type Session = {
  iracing_cust_id: string | number;
  iracing_name: string;
  expiresAt: number;
};

function clearSession() {
  const res = NextResponse.json({ authenticated: false });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function GET(req: NextRequest) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    return NextResponse.json(
      { error: "Missing SESSION_SECRET" },
      { status: 500 }
    );
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false });
  }

  const session = verifyJson<Session>(sessionCookie, sessionSecret);
  if (!session) {
    return clearSession();
  }

  if (session.expiresAt && Date.now() > session.expiresAt) {
    return clearSession();
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      iracing_cust_id: session.iracing_cust_id,
      iracing_name: session.iracing_name,
      expiresAt: session.expiresAt,
    },
  });
}
