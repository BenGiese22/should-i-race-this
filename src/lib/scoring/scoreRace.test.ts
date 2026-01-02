import { scoreRace } from "./scoreRace";
import type { ScoreInputs } from "./types";

function baseInput(): ScoreInputs {
  return {
    mode: "balanced",
    context: {
      seriesId: 1,
      trackId: 1,
      raceLengthMin: 40,
      timeSlotLocalHour: 20,
      isFixedSetup: true,
    },
    personal: {
      expectedFinishDeltaPositions: 0,
      incidentsPerRace: 6,
      finishPositionStdDev: 5,
      startsOnCombo: 8,
    },
    global: {
      incidentsPerRaceAvg: 7,
      finishPositionStdDevAvg: 6,
      attritionRate: 0.18,
      sofStdDevByTimeSlot: 400,
    },
  };
}

describe("scoreRace()", () => {
  it("returns a score between 0 and 100", () => {
    const res = scoreRace(baseInput());
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeLessThanOrEqual(100);
  });

  it("scores higher when expected finish delta improves", () => {
    const a = baseInput();
    const b = baseInput();
    b.personal.expectedFinishDeltaPositions = 5;

    const resA = scoreRace(a);
    const resB = scoreRace(b);

    expect(resB.score).toBeGreaterThan(resA.score);
  });

  it("penalizes high incident rates", () => {
    const a = baseInput();
    const b = baseInput();
    b.personal.incidentsPerRace = 14;

    const resA = scoreRace(a);
    const resB = scoreRace(b);

    expect(resB.score).toBeLessThan(resA.score);
    expect(["medium", "high"]).toContain(resB.srRisk);
  });

  it("SR recovery mode is more conservative than iRating push mode", () => {
    const risky = baseInput();
    risky.personal.incidentsPerRace = 12;
    risky.global.attritionRate = 0.3;
    risky.context.raceLengthMin = 60;

    const sr = scoreRace({ ...risky, mode: "sr_recovery" });
    const push = scoreRace({ ...risky, mode: "irating_push" });

    expect(sr.score).toBeLessThan(push.score);
  });

  it("late-night slots increase iRating risk vs daytime", () => {
    const day = baseInput();
    const night = baseInput();
    day.context.timeSlotLocalHour = 14;
    night.context.timeSlotLocalHour = 23;

    const resDay = scoreRace(day);
    const resNight = scoreRace(night);

    const riskOrder = { low: 0, medium: 1, high: 2 } as const;
    expect(riskOrder[resNight.iratingRisk]).toBeGreaterThanOrEqual(
      riskOrder[resDay.iratingRisk]
    );
  });
});
