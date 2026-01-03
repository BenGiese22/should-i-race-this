import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ingestCatalog } from "@/server/ingest/catalog";

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
  const typeParam = (searchParams.get("type") ?? "all").toLowerCase();
  const debugParam = searchParams.get("debug") === "true";

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

  const ingestTracks = typeParam === "all" || typeParam === "tracks";
  const ingestSeries = typeParam === "all" || typeParam === "series";

  const summary = await ingestCatalog(account, {
    tracks: ingestTracks,
    series: ingestSeries,
    debug: debugParam,
  });

  return NextResponse.json(summary);
}
