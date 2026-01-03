import { prisma } from "@/server/db/prisma";
import type { IRacingAccount } from "@prisma/client";
import { iracingDataFetch } from "@/server/iracing/client";

type SeasonListEntry = {
  season_id: number;
  series_id: number;
  series_name?: string;
  category?: string;
  year?: number;
  season_quarter?: number;
  fixed_setup?: boolean;
  open_setup?: boolean;
};

type SeasonListResponse = {
  seasons?: SeasonListEntry[];
  season?: SeasonListEntry[];
  data?: SeasonListEntry[];
};

type ScheduleWeek = {
  week_num?: number;
  race_week_num?: number;
  track_id?: number;
  track_name?: string;
  track_config_name?: string;
  track?: {
    track_id: number;
    track_name: string;
    config_name?: string;
  };
  race_length_minutes?: number;
  race_length_min?: number;
  race_length?: number;
  fixed_setup?: boolean;
  sessions?: Array<{
    start_time?: string;
    session_start_time?: string;
  }>;
  session_start_times?: string[];
};

type SeasonScheduleResponse = {
  season_id: number;
  series_id: number;
  series_name?: string;
  series_short_name?: string;
  category?: string;
  fixed_setup?: boolean;
  open_setup?: boolean;
  race_weeks?: ScheduleWeek[];
  race_week?: ScheduleWeek[];
  schedule?: ScheduleWeek[];
  data?: ScheduleWeek[];
};

type IngestSummary = {
  seasonId: number;
  upsertedSeries: number;
  upsertedTracks: number;
  upsertedSeasons: number;
  upsertedEntries: number;
};

function extractSeasons(payload: SeasonListResponse): SeasonListEntry[] {
  if (Array.isArray(payload.seasons)) return payload.seasons;
  if (Array.isArray(payload.season)) return payload.season;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function extractWeeks(payload: SeasonScheduleResponse): ScheduleWeek[] {
  if (Array.isArray(payload.race_weeks)) return payload.race_weeks;
  if (Array.isArray(payload.race_week)) return payload.race_week;
  if (Array.isArray(payload.schedule)) return payload.schedule;
  if (Array.isArray((payload as { schedules?: ScheduleWeek[] }).schedules)) {
    return (payload as { schedules?: ScheduleWeek[] }).schedules ?? [];
  }
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function hasAnyWeekShape(payload: unknown) {
  if (!payload || typeof payload !== "object") return false;
  return (
    "race_weeks" in payload ||
    "race_week" in payload ||
    "schedule" in payload ||
    "schedules" in payload ||
    "data" in payload
  );
}

function parseHour(value?: string) {
  if (!value) return null;
  if (/^\d{1,2}:\d{2}/.test(value)) {
    const hour = Number(value.split(":")[0]);
    return Number.isFinite(hour) ? hour : null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getUTCHours();
}

function deriveTimeSlotLocalHour(week: ScheduleWeek) {
  const sessionTimes = week.session_start_times ?? [];
  const sessionFromArray = sessionTimes.find(Boolean);
  const hourFromArray = parseHour(sessionFromArray);
  if (hourFromArray !== null) return hourFromArray;

  const session = week.sessions?.find((item) => item.start_time || item.session_start_time);
  const hourFromSession = parseHour(session?.start_time ?? session?.session_start_time);
  if (hourFromSession !== null) return hourFromSession;

  return 20;
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

function findSchedulePaths(docPayload: unknown) {
  const values = new Set<string>();
  collectStrings(docPayload, values);

  return Array.from(values)
    .map((entry) => entry.trim())
    .filter((entry) => entry.includes("/") && !entry.startsWith("http"))
    .map((entry) => entry.split("?")[0])
    .filter(
      (entry) =>
        entry.toLowerCase().includes("schedule") &&
        (entry.toLowerCase().includes("season") ||
          entry.toLowerCase().includes("series"))
    )
    .map(normalizePath);
}

async function fetchScheduleWithFallback(
  account: IRacingAccount,
  params: Record<string, string | number | undefined>,
  pathOverride?: string
): Promise<SeasonScheduleResponse> {
  const candidates = new Set<string>();
  if (pathOverride) candidates.add(normalizePath(pathOverride));
  if (process.env.IRACING_SCHEDULE_PATH) {
    candidates.add(normalizePath(process.env.IRACING_SCHEDULE_PATH));
  }

  try {
    const doc = await iracingDataFetch<unknown>(account, "doc");
    findSchedulePaths(doc).forEach((entry) => candidates.add(entry));
  } catch {
    // If doc fails, fall back to common endpoints.
  }

  [
    "season/schedule",
    "season/season_schedule",
    "series/schedule",
    "series/season_schedule",
  ].forEach((entry) => candidates.add(entry));

  const tried: string[] = [];
  for (const path of candidates) {
    tried.push(path);
    try {
      return await iracingDataFetch<SeasonScheduleResponse>(account, path, params);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("No such method") ||
        message.includes("Not Found")
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Schedule fetch failed. Tried endpoints: ${tried.join(", ")}`
  );
}

function currentSeasonParams() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
  return { seasonYear: year, seasonQuarter: quarter };
}

export async function ingestSchedule(
  account: IRacingAccount,
  seasonIdOverride?: number,
  seasonYearOverride?: number,
  seasonQuarterOverride?: number,
  schedulePathOverride?: string,
  debug?: boolean
): Promise<IngestSummary> {
  const { seasonYear: defaultYear, seasonQuarter: defaultQuarter } =
    currentSeasonParams();
  const seasonYear = seasonYearOverride ?? defaultYear;
  const seasonQuarter = seasonQuarterOverride ?? defaultQuarter;

  const seasons = await iracingDataFetch<SeasonListResponse>(account, "season/list", {
    season_year: seasonYear,
    season_quarter: seasonQuarter,
  });
  const seasonList = extractSeasons(seasons);
  const selectedSeasonId =
    seasonIdOverride ??
    seasonList.reduce((max, s) => Math.max(max, s.season_id), 0);

  if (!selectedSeasonId) {
    throw new Error("No seasons found in iRacing season list response.");
  }

  const schedule = await fetchScheduleWithFallback(
    account,
    {
      season_id: selectedSeasonId,
      season_year: seasonYear,
      season_quarter: seasonQuarter,
      series_id: seasonList.find((s) => s.season_id === selectedSeasonId)?.series_id,
    },
    schedulePathOverride
  );

  if (debug) {
    const keys = Object.keys(schedule as Record<string, unknown>);
    const weekShapes = hasAnyWeekShape(schedule) ? keys : [];
    console.log("Schedule keys:", keys);
    console.log("Schedule week shape present:", weekShapes.length > 0);
  }

  const weeks = extractWeeks(schedule);
  if (weeks.length === 0) {
    if (debug) {
      return {
        seasonId: selectedSeasonId,
        upsertedSeries: 0,
        upsertedTracks: 0,
        upsertedSeasons: 0,
        upsertedEntries: 0,
      };
    }
    throw new Error("No schedule weeks found in iRacing schedule response.");
  }

  const maxWeek = weeks.reduce((max, week, index) => {
    const weekNum = week.week_num ?? week.race_week_num ?? index + 1;
    return Math.max(max, weekNum);
  }, 0);

  const seriesId =
    schedule.series_id ??
    seasonList.find((s) => s.season_id === selectedSeasonId)?.series_id;
  if (!seriesId) {
    throw new Error("Missing series_id in schedule response.");
  }
  const seriesName =
    schedule.series_name ??
    schedule.series_short_name ??
    seasonList.find((s) => s.season_id === selectedSeasonId)?.series_name ??
    `Series ${seriesId}`;
  const seriesCategory = (
    schedule.category ??
    seasonList.find((s) => s.season_id === selectedSeasonId)?.category ??
    "road"
  ).toLowerCase();
  const seriesFixed =
    schedule.fixed_setup ??
    seasonList.find((s) => s.season_id === selectedSeasonId)?.fixed_setup ??
    null;
  const seriesOpen =
    schedule.open_setup ??
    seasonList.find((s) => s.season_id === selectedSeasonId)?.open_setup ??
    null;

  const seenSeries = new Set<number>();
  const seenTracks = new Set<number>();
  let upsertedEntries = 0;

  if (seriesId) {
    await prisma.series.upsert({
      where: { id: seriesId },
      update: {
        name: seriesName,
        category: seriesCategory,
        isFixedSetup: seriesFixed,
        isOpenSetup: seriesOpen,
      },
      create: {
        id: seriesId,
        name: seriesName,
        category: seriesCategory,
        isFixedSetup: seriesFixed,
        isOpenSetup: seriesOpen,
      },
    });
    seenSeries.add(seriesId);
  }

  await prisma.season.upsert({
    where: { id: selectedSeasonId },
    update: {
      seriesId: seriesId ?? schedule.series_id,
      year: seasonList.find((s) => s.season_id === selectedSeasonId)?.year ?? null,
      seasonQuarter: seasonList.find((s) => s.season_id === selectedSeasonId)?.season_quarter ?? null,
    },
    create: {
      id: selectedSeasonId,
      seriesId: seriesId ?? schedule.series_id,
      year: seasonList.find((s) => s.season_id === selectedSeasonId)?.year ?? null,
      seasonQuarter: seasonList.find((s) => s.season_id === selectedSeasonId)?.season_quarter ?? null,
    },
  });

  for (const [index, week] of weeks.entries()) {
    const weekNum = week.week_num ?? week.race_week_num ?? index + 1;
    const trackId = week.track?.track_id ?? week.track_id;
    const trackName = week.track?.track_name ?? week.track_name;
    const trackConfig = week.track?.config_name ?? week.track_config_name ?? null;

    if (!trackId || !trackName || !seriesId) continue;

    if (!seenTracks.has(trackId)) {
      await prisma.track.upsert({
        where: { id: trackId },
        update: { name: trackName, configName: trackConfig },
        create: { id: trackId, name: trackName, configName: trackConfig },
      });
      seenTracks.add(trackId);
    }

    const raceLengthMin =
      week.race_length_minutes ?? week.race_length_min ?? week.race_length ?? 20;
    const timeSlotLocalHour = deriveTimeSlotLocalHour(week);
    const isFixedSetup = week.fixed_setup ?? seriesFixed ?? false;

    await prisma.scheduleEntry.upsert({
      where: {
        seasonId_week_trackId_timeSlotLocalHour: {
          seasonId: selectedSeasonId,
          week: weekNum,
          trackId,
          timeSlotLocalHour,
        },
      },
      update: {
        seriesId,
        raceLengthMin,
        isFixedSetup,
      },
      create: {
        seasonId: selectedSeasonId,
        seriesId,
        trackId,
        week: weekNum,
        raceLengthMin,
        timeSlotLocalHour,
        isFixedSetup,
      },
    });

    upsertedEntries += 1;
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      activeSeasonId: selectedSeasonId,
      activeWeek: maxWeek || null,
    },
    create: {
      id: 1,
      activeSeasonId: selectedSeasonId,
      activeWeek: maxWeek || null,
    },
  });

  return {
    seasonId: selectedSeasonId,
    upsertedSeries: seenSeries.size,
    upsertedTracks: seenTracks.size,
    upsertedSeasons: 1,
    upsertedEntries,
  };
}
