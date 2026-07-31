export interface DailyStockSummary {
  day: string;
  lowAverage: number | null;
  highAverage: number | null;
  volume: number;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}
