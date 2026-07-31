import { describe, expect, it } from "vitest";
import type { DailyStockSummary } from "../types/stock";
import { deriveMarketSummary } from "./stockData";

describe("deriveMarketSummary", () => {
  it("derives date bounds, trading days, averages, and total volume", () => {
    const results: DailyStockSummary[] = [
      {
        day: "2024-05-03",
        lowAverage: 30,
        highAverage: 42,
        volume: 3_000,
      },
      {
        day: "2024-05-01",
        lowAverage: 10,
        highAverage: null,
        volume: 1_000,
      },
      {
        day: "2024-05-02",
        lowAverage: null,
        highAverage: 18,
        volume: 2_000,
      },
    ];

    expect(deriveMarketSummary(results)).toEqual({
      startDay: "2024-05-01",
      endDay: "2024-05-03",
      tradingDays: 3,
      overallAverageLow: 20,
      overallAverageHigh: 30,
      totalVolume: 6_000,
    });
  });

  it("returns null averages when no valid daily averages exist", () => {
    const results: DailyStockSummary[] = [
      {
        day: "2024-05-01",
        lowAverage: null,
        highAverage: null,
        volume: 1_000,
      },
    ];

    const summary = deriveMarketSummary(results);

    expect(summary.overallAverageLow).toBeNull();
    expect(summary.overallAverageHigh).toBeNull();
  });
});
