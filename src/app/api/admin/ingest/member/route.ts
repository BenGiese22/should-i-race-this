import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ingestMember } from "@/server/ingest/member";

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
  const debugParam = searchParams.get("debug");
  const pathParam = searchParams.get("path");
  if (!custIdParam) {
    return NextResponse.json({ error: "Missing custId" }, { status: 400 });
  }

  const custId = Number(custIdParam);
  const account = await prisma.iRacingAccount.findUnique({ where: { custId } });
  if (!account) {
    return NextResponse.json({ error: "No iRacing account found." }, { status: 404 });
  }

  const summary = await ingestMember(
    account,
    custId,
    debugParam === "true",
    pathParam ?? undefined
  );
  return NextResponse.json(summary);
}
