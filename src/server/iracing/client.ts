import { prisma } from "@/server/db/prisma";
import type { IRacingAccount } from "@prisma/client";
import { oauthBaseUrl } from "@/lib/auth/iracingOAuth";

const MEMBERS_BASE_URL = "https://members-ng.iracing.com";
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

type TokenRefreshResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

function hasLink(payload: unknown): payload is { link: string } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "link" in payload &&
    typeof (payload as { link?: unknown }).link === "string"
  );
}

export async function getIRacingAccountForUser(userId: string) {
  return prisma.iRacingAccount.findUnique({ where: { userId } });
}

export async function ensureValidAccessToken(account: IRacingAccount) {
  const now = Date.now();
  if (account.accessTokenExpiresAt.getTime() - REFRESH_BUFFER_MS > now) {
    return account;
  }

  const clientId = process.env.IRACING_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing IRACING_CLIENT_ID");
  }

  const form = new URLSearchParams();
  form.set("grant_type", "refresh_token");
  form.set("client_id", clientId);
  form.set("refresh_token", account.refreshToken ?? "");
  if (process.env.IRACING_CLIENT_SECRET) {
    form.set("client_secret", process.env.IRACING_CLIENT_SECRET);
  }

  const resp = await fetch(`${oauthBaseUrl()}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!resp.ok) {
    const details = await resp.text();
    throw new Error(`Token refresh failed: ${resp.status} ${details}`);
  }

  const data = (await resp.json()) as TokenRefreshResponse;
  if (!data.access_token) {
    throw new Error("Token refresh missing access_token");
  }

  const expiresIn = data.expires_in ?? 3600;
  const accessTokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  const updated = await prisma.iRacingAccount.update({
    where: { id: account.id },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? account.refreshToken,
      accessTokenExpiresAt,
    },
  });

  return updated;
}

export async function iracingDataFetch<T>(
  account: IRacingAccount,
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const refreshed = await ensureValidAccessToken(account);
  const url = new URL(`${MEMBERS_BASE_URL}/data/${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${refreshed.accessToken}` },
  });

  if (!resp.ok) {
    const details = await resp.text();
    throw new Error(`iRacing fetch failed: ${resp.status} ${details}`);
  }

  const payload = (await resp.json()) as unknown;
  if (hasLink(payload)) {
    const linkResp = await fetch(payload.link);
    if (!linkResp.ok) {
      const details = await linkResp.text();
      throw new Error(`iRacing link fetch failed: ${linkResp.status} ${details}`);
    }
    return (await linkResp.json()) as T;
  }

  return payload as T;
}
