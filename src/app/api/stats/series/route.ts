import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyJson } from "@/lib/auth/signedCookie";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";

type SessionPayload = {
  iracing_cust_id: number;
};

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

  type SeriesStatWithSeries = {
    seriesId: number;
    starts: number;
    avgFinishPos: number;
    incidentsPerRace: number;
    lastRaceAt: Date | null;
    series: { name: string };
  };

  const stats: SeriesStatWithSeries[] = await prisma.memberSeriesStat.findMany({
    where: { custId },
    include: { series: true },
    orderBy: [{ starts: "desc" }, { avgFinishPos: "asc" }],
    take: 12,
  });

  return NextResponse.json({
    items: stats.map((stat) => ({
      seriesId: stat.seriesId,
      seriesName: stat.series.name,
      starts: stat.starts,
      avgFinishPos: stat.avgFinishPos,
      incidentsPerRace: stat.incidentsPerRace,
      lastRaceAt: stat.lastRaceAt?.toISOString() ?? null,
    })),
  });
}
