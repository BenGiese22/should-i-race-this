import { prisma } from "@/server/db/prisma";

export type PerformanceView = "series" | "track" | "combo";

export type PerformanceWindow = {
  seasonIds: number[];
  label: string;
};

export type PerformanceRow = {
  key: string;
  label: string;
  seriesId?: number;
  trackId?: number;
  starts: number;
  avgFinish: number;
  incPerRace: number;
};

export type PerformanceSummary = {
  window: PerformanceWindow;
  view: PerformanceView;
  rows: PerformanceRow[];
};

type SeasonStub = { id: number };

function buildWindowLabel(seasons: SeasonStub[]) {
  if (seasons.length >= 2) return "Current + Previous Season";
  if (seasons.length === 1) return "Current Season";
  return "No seasons available";
}

async function getSeasonWindow(): Promise<PerformanceWindow> {
  const seasons = await prisma.season.findMany({
    orderBy: { id: "desc" },
    take: 2,
    select: { id: true },
  });
  return {
    seasonIds: seasons.map((season) => season.id),
    label: buildWindowLabel(seasons),
  };
}

function sortRows(rows: PerformanceRow[]) {
  return rows.sort((a, b) => {
    const startsDelta = b.starts - a.starts;
    if (startsDelta !== 0) return startsDelta;
    return a.avgFinish - b.avgFinish;
  });
}

export async function getPerformanceSummary(
  custId: number,
  view: PerformanceView
): Promise<PerformanceSummary> {
  const window = await getSeasonWindow();
  if (window.seasonIds.length === 0) {
    return { window, view, rows: [] };
  }

  if (view === "series") {
    const grouped = await prisma.memberRaceResult.groupBy({
      by: ["seriesId"],
      where: { custId, seasonId: { in: window.seasonIds } },
      _count: { _all: true },
      _avg: { finishPos: true, incidents: true },
    });

    const seriesIds = grouped.map((row) => row.seriesId);
    const series = await prisma.series.findMany({
      where: { id: { in: seriesIds } },
      select: { id: true, name: true },
    });
    const seriesById = new Map(series.map((item) => [item.id, item.name]));

    const rows = grouped.map((row) => ({
      key: `series-${row.seriesId}`,
      label: seriesById.get(row.seriesId) ?? `Series ${row.seriesId}`,
      seriesId: row.seriesId,
      starts: row._count._all,
      avgFinish: row._avg.finishPos ?? 0,
      incPerRace: row._avg.incidents ?? 0,
    }));

    return { window, view, rows: sortRows(rows) };
  }

  if (view === "track") {
    const grouped = await prisma.memberRaceResult.groupBy({
      by: ["trackId"],
      where: { custId, seasonId: { in: window.seasonIds } },
      _count: { _all: true },
      _avg: { finishPos: true, incidents: true },
    });

    const trackIds = grouped.map((row) => row.trackId);
    const tracks = await prisma.track.findMany({
      where: { id: { in: trackIds } },
      select: { id: true, name: true },
    });
    const tracksById = new Map(tracks.map((item) => [item.id, item.name]));

    const rows = grouped.map((row) => ({
      key: `track-${row.trackId}`,
      label: tracksById.get(row.trackId) ?? `Track ${row.trackId}`,
      trackId: row.trackId,
      starts: row._count._all,
      avgFinish: row._avg.finishPos ?? 0,
      incPerRace: row._avg.incidents ?? 0,
    }));

    return { window, view, rows: sortRows(rows) };
  }

  const grouped = await prisma.memberRaceResult.groupBy({
    by: ["seriesId", "trackId"],
    where: { custId, seasonId: { in: window.seasonIds } },
    _count: { _all: true },
    _avg: { finishPos: true, incidents: true },
  });

  const seriesIds = Array.from(new Set(grouped.map((row) => row.seriesId)));
  const trackIds = Array.from(new Set(grouped.map((row) => row.trackId)));

  const [series, tracks] = await Promise.all([
    prisma.series.findMany({
      where: { id: { in: seriesIds } },
      select: { id: true, name: true },
    }),
    prisma.track.findMany({
      where: { id: { in: trackIds } },
      select: { id: true, name: true },
    }),
  ]);

  const seriesById = new Map(series.map((item) => [item.id, item.name]));
  const tracksById = new Map(tracks.map((item) => [item.id, item.name]));

  const rows = grouped.map((row) => {
    const seriesName = seriesById.get(row.seriesId) ?? `Series ${row.seriesId}`;
    const trackName = tracksById.get(row.trackId) ?? `Track ${row.trackId}`;
    return {
      key: `combo-${row.seriesId}-${row.trackId}`,
      label: `${seriesName} @ ${trackName}`,
      seriesId: row.seriesId,
      trackId: row.trackId,
      starts: row._count._all,
      avgFinish: row._avg.finishPos ?? 0,
      incPerRace: row._avg.incidents ?? 0,
    };
  });

  return { window, view, rows: sortRows(rows) };
}
