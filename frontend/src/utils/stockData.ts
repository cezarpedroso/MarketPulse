import type { DailyStockSummary } from "../types/stock";

export interface MarketSummary {
  startDay: string;
  endDay: string;
  tradingDays: number;
  overallAverageLow: number | null;
  overallAverageHigh: number | null;
  totalVolume: number;
}

export interface StockChartPoint {
  day: string;
  lowAverage: number | null;
  highAverage: number | null;
}

const average = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const sortByDayAscending = (
  results: DailyStockSummary[],
): DailyStockSummary[] =>
  [...results].sort((left, right) => left.day.localeCompare(right.day));

export const sortByDayDescending = (
  results: DailyStockSummary[],
): DailyStockSummary[] =>
  [...results].sort((left, right) => right.day.localeCompare(left.day));

export const deriveMarketSummary = (
  results: DailyStockSummary[],
): MarketSummary => {
  const orderedResults = sortByDayAscending(results);
  const lowValues = orderedResults.flatMap((item) =>
    item.lowAverage === null ? [] : [item.lowAverage],
  );
  const highValues = orderedResults.flatMap((item) =>
    item.highAverage === null ? [] : [item.highAverage],
  );

  return {
    startDay: orderedResults[0]?.day ?? "",
    endDay: orderedResults.at(-1)?.day ?? "",
    tradingDays: orderedResults.length,
    overallAverageLow: average(lowValues),
    overallAverageHigh: average(highValues),
    totalVolume: orderedResults.reduce(
      (sum, item) => sum + item.volume,
      0,
    ),
  };
};

export const toChartData = (
  results: DailyStockSummary[],
): StockChartPoint[] =>
  sortByDayAscending(results).map((item) => ({
    day: item.day,
    lowAverage: item.lowAverage,
    highAverage: item.highAverage,
  }));
