import type { SeriesStatsResponse } from "@/features/recommendations/types";

export async function getSeriesStats(): Promise<SeriesStatsResponse> {
  const response = await fetch("/api/stats/series", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Series stats request failed (${response.status}).`);
  }
  return (await response.json()) as SeriesStatsResponse;
}
