import { NextRequest, NextResponse } from "next/server";

// This route exists ONLY to match iRacing's registered redirect URI.
// It forwards the request to the real auth callback handler.
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // Preserve query params (?code=...&state=...)
  const forwardTo = new URL("/api/auth/callback", url.origin);
  forwardTo.search = url.search;

  return NextResponse.redirect(forwardTo);
}
