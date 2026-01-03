import { NextRequest, NextResponse } from "next/server";
import { revokeToken } from "@/lib/auth/iracingOAuth";
import { SESSION_COOKIE, verifyJson } from "@/lib/auth/signedCookie";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";

type Session = {
  iracing_cust_id: number;
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
    const custId = Number(session?.iracing_cust_id);
    if (Number.isFinite(custId)) {
      const account = await prisma.iRacingAccount.findUnique({
        where: { custId },
      });
      if (account?.accessToken) {
        try {
          await revokeToken({
            clientId,
            clientSecret,
            token: account.accessToken,
          });
        } catch {
          // Best-effort revoke; continue logout.
        }
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
