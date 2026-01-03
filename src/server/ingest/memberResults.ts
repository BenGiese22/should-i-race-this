import { prisma } from "@/server/db/prisma";
import type { IRacingAccount } from "@prisma/client";
import { iracingDataFetch } from "@/server/iracing/client";

type RecentRace = {
  season_id?: number;
  track_id?: number;
  series_id?: number;
  finish_pos?: number;
  incidents?: number;
};

type RecentRacesResponse = {
  races?: RecentRace[];
  data?: RecentRace[];
  results?: RecentRace[];
};

type IngestSummary = {
  custId: number;
  seasonIds: number[];
  insertedResults: number;
};

function extractRaces(payload: RecentRacesResponse): RecentRace[] {
  if (Array.isArray(payload.races)) return payload.races;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function hasRequiredNumbers(
  race: RecentRace
): race is Required<Pick<RecentRace, "series_id" | "track_id" | "finish_pos" | "incidents">> {
  return (
    typeof race.series_id === "number" &&
    typeof race.track_id === "number" &&
    typeof race.finish_pos === "number" &&
    typeof race.incidents === "number"
  );
}

export async function ingestMemberResults(
  account: IRacingAccount,
  custId: number
): Promise<IngestSummary> {
  const payload = await iracingDataFetch<RecentRacesResponse>(
    account,
    "stats/member_recent_races",
    { cust_id: custId }
  );

  const races = extractRaces(payload).filter(hasRequiredNumbers);
  if (races.length === 0) {
    return { custId, seasonIds: [], insertedResults: 0 };
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const activeSeasonId =
    settings?.activeSeasonId ??
    (await prisma.season.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    }))?.id ??
    null;

  const normalizedRaces = races
    .map((race) => ({
      ...race,
      season_id: race.season_id ?? activeSeasonId,
    }))
    .filter((race): race is typeof race & { season_id: number } =>
      typeof race.season_id === "number"
    );

  if (normalizedRaces.length === 0) {
    return { custId, seasonIds: [], insertedResults: 0 };
  }

  const seasonIds = Array.from(
    new Set(normalizedRaces.map((race) => race.season_id))
  );
  const seriesIds = Array.from(
    new Set(normalizedRaces.map((race) => race.series_id))
  );
  const trackIds = Array.from(
    new Set(normalizedRaces.map((race) => race.track_id))
  );

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

  if (trackIds.length > 0) {
    const existingTracks = await prisma.track.findMany({
      where: { id: { in: trackIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingTracks.map((track) => track.id));
    const missingTracks = trackIds.filter((id) => !existingIds.has(id));
    if (missingTracks.length > 0) {
      await prisma.track.createMany({
        data: missingTracks.map((id) => ({
          id,
          name: `Unknown Track ${id}`,
          configName: null,
        })),
        skipDuplicates: true,
      });
    }
  }

  if (seasonIds.length > 0) {
    const existingSeasons = await prisma.season.findMany({
      where: { id: { in: seasonIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingSeasons.map((season) => season.id));
    const missingSeasons = seasonIds.filter((id) => !existingIds.has(id));
    if (missingSeasons.length > 0) {
      const seasonData = missingSeasons
        .map((id) => {
          const match = normalizedRaces.find((race) => race.season_id === id);
          if (!match?.series_id) return null;
          return {
            id,
            seriesId: match.series_id,
            year: null,
            seasonQuarter: null,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (seasonData.length > 0) {
        await prisma.season.createMany({
          data: seasonData,
          skipDuplicates: true,
        });
      }
    }
  }

  const validSeasons = await prisma.season.findMany({
    where: { id: { in: seasonIds } },
    select: { id: true },
  });
  const validSeasonIds = new Set(validSeasons.map((season) => season.id));

  const filteredRaces = normalizedRaces.filter((race) =>
    validSeasonIds.has(race.season_id)
  );

  if (filteredRaces.length === 0) {
    return { custId, seasonIds: [], insertedResults: 0 };
  }

  await prisma.memberRaceResult.deleteMany({
    where: { custId, seasonId: { in: Array.from(validSeasonIds) } },
  });

  const resultRows = filteredRaces.map((race) => ({
    custId,
    seasonId: race.season_id,
    seriesId: race.series_id,
    trackId: race.track_id,
    finishPos: race.finish_pos,
    incidents: race.incidents,
  }));

  const created = await prisma.memberRaceResult.createMany({
    data: resultRows,
  });

  return {
    custId,
    seasonIds: Array.from(validSeasonIds),
    insertedResults: created.count,
  };
}
