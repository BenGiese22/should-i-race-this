import { prisma } from "@/server/db/prisma";
import type { IRacingAccount } from "@prisma/client";
import { iracingDataFetch } from "@/server/iracing/client";

type TrackEntry = {
  track_id?: number;
  track_name?: string;
  track_config_name?: string;
  config_name?: string;
};

type SeriesEntry = {
  series_id?: number;
  series_name?: string;
  series_short_name?: string;
  category?: string;
  fixed_setup?: boolean;
  open_setup?: boolean;
};

type TrackCatalogResponse = {
  tracks?: TrackEntry[];
  data?: TrackEntry[];
};

type SeriesCatalogResponse = {
  series?: SeriesEntry[];
  data?: SeriesEntry[];
};

type CatalogSummary = {
  upsertedTracks: number;
  upsertedSeries: number;
};

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

async function findDocPaths(account: IRacingAccount, keyword: string) {
  try {
    const doc = await iracingDataFetch<unknown>(account, "doc");
    const values = new Set<string>();
    collectStrings(doc, values);
    return Array.from(values)
      .map((entry) => entry.trim())
      .filter((entry) => entry.includes("/") && !entry.startsWith("http"))
      .map((entry) => entry.split("?")[0])
      .filter((entry) => entry.toLowerCase().includes(keyword))
      .map(normalizePath);
  } catch {
    return [];
  }
}

async function fetchCatalog<T>(
  account: IRacingAccount,
  keyword: string,
  defaults: string[]
): Promise<T> {
  const candidates = new Set<string>();
  defaults.forEach((entry) => candidates.add(entry));
  const discovered = await findDocPaths(account, keyword);
  discovered.forEach((entry) => candidates.add(entry));

  const tried: string[] = [];
  for (const path of candidates) {
    tried.push(path);
    try {
      return await iracingDataFetch<T>(account, path);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("No such method") || message.includes("Not Found")) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Catalog fetch failed. Tried endpoints: ${tried.join(", ")}`);
}

function extractTracks(payload: TrackCatalogResponse): TrackEntry[] {
  if (Array.isArray(payload)) return payload as TrackEntry[];
  if (Array.isArray(payload.tracks)) return payload.tracks;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function extractSeries(payload: SeriesCatalogResponse): SeriesEntry[] {
  if (Array.isArray(payload)) return payload as SeriesEntry[];
  if (Array.isArray(payload.series)) return payload.series;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export async function ingestCatalog(
  account: IRacingAccount,
  options?: { tracks?: boolean; series?: boolean; debug?: boolean }
): Promise<CatalogSummary> {
  const ingestTracks = options?.tracks ?? true;
  const ingestSeries = options?.series ?? true;
  const summary: CatalogSummary = { upsertedTracks: 0, upsertedSeries: 0 };

  if (ingestTracks) {
    const payload = await fetchCatalog<TrackCatalogResponse>(account, "track", [
      "track/get",
      "tracks/get",
    ]);
    const tracks = extractTracks(payload);
    if (options?.debug) {
      console.log("Track catalog keys:", Object.keys(payload as object));
      console.log("Track catalog count:", tracks.length);
    }
    for (const track of tracks) {
      const id = track.track_id;
      const name = track.track_name;
      if (!id || !name) continue;
      await prisma.track.upsert({
        where: { id },
        update: {
          name,
          configName: track.track_config_name ?? track.config_name ?? null,
        },
        create: {
          id,
          name,
          configName: track.track_config_name ?? track.config_name ?? null,
        },
      });
      summary.upsertedTracks += 1;
    }
  }

  if (ingestSeries) {
    const payload = await fetchCatalog<SeriesCatalogResponse>(account, "series", [
      "series/get",
      "series/list",
    ]);
    const seriesList = extractSeries(payload);
    if (options?.debug) {
      console.log("Series catalog keys:", Object.keys(payload as object));
      console.log("Series catalog count:", seriesList.length);
    }
    for (const series of seriesList) {
      const id = series.series_id;
      if (!id) continue;
      const name = series.series_name ?? series.series_short_name ?? `Series ${id}`;
      const category = (series.category ?? "road").toLowerCase();
      await prisma.series.upsert({
        where: { id },
        update: {
          name,
          category,
          isFixedSetup: series.fixed_setup ?? null,
          isOpenSetup: series.open_setup ?? null,
        },
        create: {
          id,
          name,
          category,
          isFixedSetup: series.fixed_setup ?? null,
          isOpenSetup: series.open_setup ?? null,
        },
      });
      summary.upsertedSeries += 1;
    }
  }

  return summary;
}
