import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ingestSchedule } from "@/server/ingest/schedule";

export const runtime = "nodejs";

function getProvidedSecret(req: NextRequest) {
  return (
    req.headers.get("x-ingest-secret") ??
    new URL(req.url).searchParams.get("secret")
  );
}

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_INGEST_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Missing ADMIN_INGEST_SECRET" },
      { status: 500 }
    );
  }

  const provided = getProvidedSecret(req);
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const custIdParam = searchParams.get("custId");
  const seasonIdParam = searchParams.get("seasonId");
  const seasonYearParam = searchParams.get("seasonYear");
  const seasonQuarterParam = searchParams.get("seasonQuarter");
  const schedulePathParam = searchParams.get("path");
  const debugParam = searchParams.get("debug");

  const account = custIdParam
    ? await prisma.iRacingAccount.findUnique({
        where: { custId: Number(custIdParam) },
      })
    : await prisma.iRacingAccount.findFirst({
        orderBy: { updatedAt: "desc" },
      });

  if (!account) {
    return NextResponse.json({ error: "No iRacing account found." }, { status: 400 });
  }

  const seasonId = seasonIdParam ? Number(seasonIdParam) : undefined;
  const seasonYear = seasonYearParam ? Number(seasonYearParam) : undefined;
  const seasonQuarter = seasonQuarterParam ? Number(seasonQuarterParam) : undefined;
  const summary = await ingestSchedule(
    account,
    seasonId,
    seasonYear,
    seasonQuarter,
    schedulePathParam ?? undefined,
    debugParam === "true"
  );

  return NextResponse.json(summary);
}
