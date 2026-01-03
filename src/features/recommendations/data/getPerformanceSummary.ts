import type {
  PerformanceResponse,
  PerformanceView,
} from "@/features/recommendations/types";

export async function getPerformanceSummary(
  view: PerformanceView
): Promise<PerformanceResponse> {
  const response = await fetch(`/api/performance?view=${encodeURIComponent(view)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Performance request failed (${response.status}).`);
  }
  return (await response.json()) as PerformanceResponse;
}
