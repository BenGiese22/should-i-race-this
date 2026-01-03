/** @jest-environment node */

const { NextRequest } = require("next/server");
const { GET, buildRecommendationId } = require("./route");

describe("recommendations API", () => {
  it("builds a deterministic recommendation id", () => {
    const entry = {
      seriesId: 101,
      seriesName: "Series",
      trackId: 201,
      trackName: "Track",
      timeSlotLocalHour: 9,
      raceLengthMin: 25,
      isFixedSetup: true,
    };

    const first = buildRecommendationId(entry);
    const second = buildRecommendationId(entry);

    expect(first).toBe(second);
    expect(first).toBe("101-201-9-1-25");
  });

  it("returns 400 for invalid mode", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/recommendations?mode=invalid")
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 when missing session", async () => {
    const prev = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "test-secret";

    const response = await GET(
      new NextRequest("http://localhost/api/recommendations?mode=balanced")
    );

    expect(response.status).toBe(401);

    process.env.SESSION_SECRET = prev;
  });
});
