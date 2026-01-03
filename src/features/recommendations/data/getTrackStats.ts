import type { TrackStatsResponse } from "@/features/recommendations/types";

export async function getTrackStats(): Promise<TrackStatsResponse> {
  const response = await fetch("/api/stats/track", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Track stats request failed (${response.status}).`);
  }
  return (await response.json()) as TrackStatsResponse;
}
