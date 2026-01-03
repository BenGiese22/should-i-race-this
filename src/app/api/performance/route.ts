import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyJson } from "@/lib/auth/signedCookie";
import { prisma } from "@/server/db/prisma";
import { getPerformanceSummary, type PerformanceView } from "@/server/performance/getPerformance";

export const runtime = "nodejs";

type SessionPayload = {
  iracing_cust_id: number;
};

const VIEWS: PerformanceView[] = ["series", "track", "combo"];

export async function GET(req: NextRequest) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    return NextResponse.json({ error: "Missing SESSION_SECRET" }, { status: 500 });
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = verifyJson<SessionPayload>(sessionCookie, sessionSecret);
  const custId = Number(session?.iracing_cust_id);
  if (!Number.isFinite(custId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.iRacingAccount.findUnique({ where: { custId } });
  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewParam = new URL(req.url).searchParams.get("view");
  const view = VIEWS.includes(viewParam as PerformanceView)
    ? (viewParam as PerformanceView)
    : "series";

  const summary = await getPerformanceSummary(custId, view);
  return NextResponse.json(summary);
}
