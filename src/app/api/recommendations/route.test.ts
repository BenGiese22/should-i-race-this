/** @jest-environment node */

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
    const prev = process.env.USE_MOCK_DATA;
    process.env.USE_MOCK_DATA = "true";

    const response = await GET(
      new Request("http://localhost/api/recommendations?mode=invalid")
    );

    expect(response.status).toBe(400);

    process.env.USE_MOCK_DATA = prev;
  });

  it("returns 501 when mock data is disabled", async () => {
    const prev = process.env.USE_MOCK_DATA;
    process.env.USE_MOCK_DATA = "false";

    const response = await GET(
      new Request("http://localhost/api/recommendations?mode=balanced")
    );

    expect(response.status).toBe(501);

    process.env.USE_MOCK_DATA = prev;
  });
});
