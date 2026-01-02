import type { RecommendationsResponse, RiskMode } from "@/features/recommendations/types";

export async function getRecommendations(
  mode: RiskMode
): Promise<RecommendationsResponse> {
  const url = `/api/recommendations?mode=${encodeURIComponent(mode)}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    let message = `Request failed with ${response.status}.`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        message = payload.error;
      }
    } catch {
      // Ignore JSON parse failures and keep the default message.
    }
    throw new Error(message);
  }

  return (await response.json()) as RecommendationsResponse;
}
