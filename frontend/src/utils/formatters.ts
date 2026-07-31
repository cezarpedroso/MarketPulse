const integerFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const chartDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const toUtcDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

export const formatAverage = (value: number | null): string =>
  value === null ? "\u2014" : value.toFixed(4);

export const formatVolume = (value: number): string =>
  integerFormatter.format(value);

export const formatCompactVolume = (value: number): string =>
  `${compactFormatter.format(value)} shares`;

export const formatDate = (isoDate: string): string =>
  dateFormatter.format(toUtcDate(isoDate));

export const formatChartDate = (isoDate: string): string =>
  chartDateFormatter.format(toUtcDate(isoDate));

export const formatDateRange = (start: string, end: string): string =>
  dateFormatter.formatRange(toUtcDate(start), toUtcDate(end));
