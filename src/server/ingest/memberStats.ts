import { prisma } from "@/server/db/prisma";
import type { IRacingAccount } from "@prisma/client";
import { iracingDataFetch } from "@/server/iracing/client";

type RecentRace = {
  track_id?: number;
  series_id?: number;
  finish_pos?: number;
  incidents?: number;
  start_time?: string;
};

type RecentRacesResponse = {
  races?: RecentRace[];
  data?: RecentRace[];
  results?: RecentRace[];
};

type IngestSummary = {
  custId: number;
  upsertedTrackStats: number;
  upsertedSeriesStats: number;
};

function extractRaces(payload: RecentRacesResponse): RecentRace[] {
  if (Array.isArray(payload.races)) return payload.races;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function aggregateByKey(
  races: RecentRace[],
  key: "track_id" | "series_id"
) {
  const map = new Map<number, RecentRace[]>();
  for (const race of races) {
    const id = race[key];
    if (!id) continue;
    const existing = map.get(id);
    if (existing) {
      existing.push(race);
    } else {
      map.set(id, [race]);
    }
  }
  return map;
}

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function latestDate(races: RecentRace[]) {
  const dates = races
    .map((race) => race.start_time)
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((value) => !Number.isNaN(value.getTime()));
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export async function ingestMemberStats(
  account: IRacingAccount,
  custId: number
): Promise<IngestSummary> {
  const payload = await iracingDataFetch<RecentRacesResponse>(
    account,
    "stats/member_recent_races",
    {
      cust_id: custId,
    }
  );

  const races = extractRaces(payload);
  const byTrack = aggregateByKey(races, "track_id");
  const bySeries = aggregateByKey(races, "series_id");

  const seriesIds = Array.from(bySeries.keys());
  if (seriesIds.length > 0) {
    const existingSeries = await prisma.series.findMany({
      where: { id: { in: seriesIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingSeries.map((series) => series.id));
    const missingSeries = seriesIds.filter((id) => !existingIds.has(id));
    if (missingSeries.length > 0) {
      await prisma.series.createMany({
        data: missingSeries.map((id) => ({
          id,
          name: `Unknown Series ${id}`,
          category: "unknown",
          isFixedSetup: null,
          isOpenSetup: null,
        })),
        skipDuplicates: true,
      });
    }
  }

  let upsertedTrackStats = 0;
  for (const [trackId, trackRaces] of byTrack.entries()) {
    const finishes = trackRaces
      .map((race) => race.finish_pos)
      .filter((value): value is number => typeof value === "number");
    const incidents = trackRaces
      .map((race) => race.incidents)
      .filter((value): value is number => typeof value === "number");

    await prisma.memberTrackStat.upsert({
      where: { custId_trackId: { custId, trackId } },
      update: {
        starts: trackRaces.length,
        avgFinishPos: avg(finishes),
        incidentsPerRace: avg(incidents),
        lastRaceAt: latestDate(trackRaces),
      },
      create: {
        custId,
        trackId,
        starts: trackRaces.length,
        avgFinishPos: avg(finishes),
        incidentsPerRace: avg(incidents),
        lastRaceAt: latestDate(trackRaces),
      },
    });
    upsertedTrackStats += 1;
  }

  let upsertedSeriesStats = 0;
  for (const [seriesId, seriesRaces] of bySeries.entries()) {
    const finishes = seriesRaces
      .map((race) => race.finish_pos)
      .filter((value): value is number => typeof value === "number");
    const incidents = seriesRaces
      .map((race) => race.incidents)
      .filter((value): value is number => typeof value === "number");

    await prisma.memberSeriesStat.upsert({
      where: { custId_seriesId: { custId, seriesId } },
      update: {
        starts: seriesRaces.length,
        avgFinishPos: avg(finishes),
        incidentsPerRace: avg(incidents),
        lastRaceAt: latestDate(seriesRaces),
      },
      create: {
        custId,
        seriesId,
        starts: seriesRaces.length,
        avgFinishPos: avg(finishes),
        incidentsPerRace: avg(incidents),
        lastRaceAt: latestDate(seriesRaces),
      },
    });
    upsertedSeriesStats += 1;
  }

  return { custId, upsertedTrackStats, upsertedSeriesStats };
}
