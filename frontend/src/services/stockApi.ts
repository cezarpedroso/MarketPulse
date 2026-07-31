import type { DailyStockSummary, ProblemDetails } from "../types/stock";

export class StockApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail?: string,
  ) {
    super(detail || title);
    this.name = "StockApiError";
  }
}

const getApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!baseUrl) {
    throw new StockApiError(
      500,
      "Frontend configuration error",
      "The MarketPulse API URL is not configured.",
    );
  }

  return baseUrl.replace(/\/+$/, "");
};

const readProblemDetails = async (
  response: Response,
): Promise<ProblemDetails | null> => {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return null;
  }
};

const isDailyStockSummary = (value: unknown): value is DailyStockSummary => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.day === "string" &&
    (typeof item.lowAverage === "number" || item.lowAverage === null) &&
    (typeof item.highAverage === "number" || item.highAverage === null) &&
    typeof item.volume === "number" &&
    Number.isInteger(item.volume)
  );
};

export const fetchStockSummary = async (
  symbol: string,
  signal: AbortSignal,
): Promise<DailyStockSummary[]> => {
  const response = await fetch(
    `${getApiBaseUrl()}/api/stocks/${encodeURIComponent(symbol)}/intraday`,
    {
      signal,
      headers: {
        Accept: "application/json, application/problem+json",
      },
    },
  );

  if (!response.ok) {
    const problem = await readProblemDetails(response);

    throw new StockApiError(
      problem?.status ?? response.status,
      problem?.title ?? "Market data request failed",
      problem?.detail,
    );
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload) || !payload.every(isDailyStockSummary)) {
    throw new StockApiError(
      500,
      "Unexpected API response",
      "The market data response was not in the expected format.",
    );
  }

  return payload;
};
