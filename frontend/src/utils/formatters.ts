const integerFormatter = new Intl.NumberFormat("en-US");

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
  value === null ? "—" : value.toFixed(4);

export const formatVolume = (value: number): string =>
  integerFormatter.format(value);

export const formatDate = (isoDate: string): string =>
  dateFormatter.format(toUtcDate(isoDate));

export const formatChartDate = (isoDate: string): string =>
  chartDateFormatter.format(toUtcDate(isoDate));

export const formatDateRange = (start: string, end: string): string =>
  start === end
    ? formatDate(start)
    : `${formatDate(start)} - ${formatDate(end)}`;
