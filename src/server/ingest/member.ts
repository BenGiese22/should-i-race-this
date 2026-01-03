import { prisma } from "@/server/db/prisma";
import type { IRacingAccount } from "@prisma/client";
import { iracingDataFetch } from "@/server/iracing/client";

type LicenseEntry = {
  category?: string;
  category_id?: number;
  irating?: number;
  sr?: number;
  sr_decimal?: number;
  safety_rating?: number;
  safety_rating_dec?: number;
};

type MemberResponse = {
  licenses?: LicenseEntry[];
  data?: { licenses?: LicenseEntry[] };
  member?: { licenses?: LicenseEntry[] };
  members?: Array<{ licenses?: LicenseEntry[] }>;
};

type IngestSummary = {
  custId: number;
  upsertedLicenses: number;
};

const CATEGORY_MAP: Record<number, string> = {
  1: "road",
  2: "oval",
  3: "dirt_road",
  4: "dirt_oval",
};

function extractLicenses(payload: MemberResponse): LicenseEntry[] {
  if (Array.isArray(payload.licenses)) return payload.licenses;
  if (Array.isArray(payload.data?.licenses)) return payload.data.licenses;
  if (Array.isArray(payload.member?.licenses)) return payload.member.licenses;
  if (Array.isArray(payload.members)) {
    const first = payload.members.find((entry) => entry?.licenses?.length);
    if (first?.licenses) return first.licenses;
  }
  return [];
}

function normalizePath(path: string) {
  return path.replace(/^\/?data\//, "").replace(/^\/+/, "");
}

function collectStrings(value: unknown, out: Set<string>) {
  if (typeof value === "string") {
    out.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, out));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) =>
      collectStrings(item, out)
    );
  }
}

async function fetchMemberLicenses(
  account: IRacingAccount,
  custId: number,
  pathOverride?: string
): Promise<MemberResponse> {
  const candidates = new Set<string>();
  if (pathOverride) candidates.add(normalizePath(pathOverride));

  try {
    const doc = await iracingDataFetch<unknown>(account, "doc");
    const values = new Set<string>();
    collectStrings(doc, values);
    Array.from(values)
      .map((entry) => entry.trim())
      .filter((entry) => entry.includes("/") && !entry.startsWith("http"))
      .map((entry) => entry.split("?")[0])
      .filter(
        (entry) =>
          entry.toLowerCase().includes("license") &&
          entry.toLowerCase().includes("member")
      )
      .map(normalizePath)
      .forEach((entry) => candidates.add(entry));
  } catch {
    // Ignore doc lookup failures and fall back to known paths.
  }

  [
    "member/get",
    "member/licenses",
    "member/licensing",
    "member/license",
    "member/get_licenses",
  ].forEach((entry) => candidates.add(entry));

  const tried: string[] = [];
  for (const path of candidates) {
    tried.push(path);
    try {
      return await iracingDataFetch<MemberResponse>(account, path, {
        cust_ids: custId,
        include_licenses: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("No such method") || message.includes("Not Found")) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Member license fetch failed. Tried endpoints: ${tried.join(", ")}`
  );
}

function normalizeCategory(entry: LicenseEntry) {
  if (entry.category) return entry.category.toLowerCase();
  if (entry.category_id && CATEGORY_MAP[entry.category_id]) {
    return CATEGORY_MAP[entry.category_id];
  }
  return null;
}

function normalizeSr(entry: LicenseEntry) {
  const value =
    entry.sr ??
    entry.sr_decimal ??
    entry.safety_rating ??
    entry.safety_rating_dec ??
    null;
  if (value === null || value === undefined) return null;
  return Number(value);
}

function logMemberDebug(payload: MemberResponse) {
  const keys = Object.keys(payload as Record<string, unknown>);
  const licenses = extractLicenses(payload);
  const members = payload.members ?? [];
  const firstMember = members[0] ?? null;
  const first = licenses[0] ?? null;
  console.log("Member payload keys:", keys);
  console.log("Member licenses count:", licenses.length);
  if (first) {
    console.log("Member license sample keys:", Object.keys(first));
  }
  if (firstMember) {
    console.log("Member sample keys:", Object.keys(firstMember));
    const nested = (firstMember as Record<string, unknown>).license;
    if (nested && typeof nested === "object") {
      console.log("Member license field keys:", Object.keys(nested));
    }
    console.log(
      "Member sample payload:",
      JSON.stringify(firstMember).slice(0, 2000)
    );
  }
}

export async function ingestMember(
  account: IRacingAccount,
  custId: number,
  debug?: boolean,
  pathOverride?: string
): Promise<IngestSummary> {
  const payload = await fetchMemberLicenses(account, custId, pathOverride);
  if (debug) logMemberDebug(payload);
  const licenses = extractLicenses(payload);

  let upsertedLicenses = 0;

  for (const license of licenses) {
    const category = normalizeCategory(license);
    const irating = license.irating ?? null;
    const sr = normalizeSr(license);
    if (!category || irating === null || sr === null) continue;

    await prisma.memberLicense.upsert({
      where: { custId_category: { custId, category } },
      update: {
        irating,
        sr,
      },
      create: {
        custId,
        category,
        irating,
        sr,
      },
    });
    upsertedLicenses += 1;
  }

  return { custId, upsertedLicenses };
}

export async function ingestMemberForUser(
  userId: string
): Promise<IngestSummary> {
  const account = await prisma.iRacingAccount.findUnique({ where: { userId } });
  if (!account) {
    throw new Error("No iRacing account found for user.");
  }
  return ingestMember(account, account.custId);
}
