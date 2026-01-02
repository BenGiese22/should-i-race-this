import type { RecommendationsResponse, RiskMode } from "@/features/recommendations/types";
import { recommendationsMocks } from "@/features/recommendations/mocks/recommendations.mock";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getRecommendations(
  mode: RiskMode
): Promise<RecommendationsResponse> {
  const jitterMs = 400 + Math.floor(Math.random() * 501);
  await delay(jitterMs);

  if (mode === "sr_recovery") {
    throw new Error("SR Recovery recommendations are temporarily unavailable.");
  }

  return recommendationsMocks[mode];
}
