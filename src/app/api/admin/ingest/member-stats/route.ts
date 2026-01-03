import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ingestCatalog } from "@/server/ingest/catalog";
import { ingestSchedule } from "@/server/ingest/schedule";
import { ingestMemberStats } from "@/server/ingest/memberStats";

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
  if (!custIdParam) {
    return NextResponse.json({ error: "Missing custId" }, { status: 400 });
  }

  const custId = Number(custIdParam);
  const account = await prisma.iRacingAccount.findUnique({ where: { custId } });
  if (!account) {
    return NextResponse.json({ error: "No iRacing account found." }, { status: 404 });
  }

  await ingestCatalog(account, { series: true, tracks: true });
  await ingestSchedule(account);
  const summary = await ingestMemberStats(account, custId);
  return NextResponse.json(summary);
}
