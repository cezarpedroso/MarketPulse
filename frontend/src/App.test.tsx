import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { fetchStockSummary, StockApiError } from "./services/stockApi";
import type { DailyStockSummary } from "./types/stock";

vi.mock("./services/stockApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./services/stockApi")>();

  return {
    ...actual,
    fetchStockSummary: vi.fn(),
  };
});

const mockedFetchStockSummary = vi.mocked(fetchStockSummary);

const result: DailyStockSummary[] = [
  {
    day: "2024-05-31",
    lowAverage: 178.67,
    highAverage: 189.24,
    volume: 18773560,
  },
];

beforeEach(() => {
  mockedFetchStockSummary.mockReset();
  mockedFetchStockSummary.mockResolvedValue(result);
});

describe("MarketPulse app", () => {
  it("renders the initial state", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "MarketPulse",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ready when you are")).toBeInTheDocument();
  });

  it("rejects invalid input without calling the API", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Stock ticker symbol"), "AAPL$");
    await user.click(screen.getByRole("button", { name: "Analyze Stock" }));

    expect(
      screen.getByText("Use only letters, numbers, periods, and hyphens."),
    ).toBeInTheDocument();
    expect(mockedFetchStockSummary).not.toHaveBeenCalled();
  });

  it("normalizes lowercase input in the symbol field", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText("Stock ticker symbol");
    await user.type(input, "aapl");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(input).toHaveValue("AAPL"));
  });

  it("calls the API with a normalized valid symbol", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Stock ticker symbol"), "  brk.b  ");
    await user.click(screen.getByRole("button", { name: "Analyze Stock" }));

    await waitFor(() =>
      expect(mockedFetchStockSummary).toHaveBeenCalledWith(
        "BRK.B",
        expect.any(AbortSignal),
      ),
    );
  });

  it("renders the loading state", async () => {
    mockedFetchStockSummary.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MSFT" }));

    expect(
      screen.getByText("Loading MSFT market data"),
    ).toBeInTheDocument();
  });

  it("renders a friendly not-found message for 404 responses", async () => {
    mockedFetchStockSummary.mockRejectedValue(
      new StockApiError(404, "Stock data not found"),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "TSLA" }));

    expect(await screen.findByText("Stock data not found")).toBeInTheDocument();
    expect(
      screen.getByText(
        "We couldn't find market data for TSLA. Check the ticker and try again.",
      ),
    ).toBeInTheDocument();
  });

  it("renders a friendly provider failure message", async () => {
    mockedFetchStockSummary.mockRejectedValue(
      new StockApiError(502, "Stock provider error"),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "NVDA" }));

    expect(
      await screen.findByText("Market data is unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The market data provider is temporarily unavailable. Please try again shortly.",
      ),
    ).toBeInTheDocument();
  });

  it("uses a quick pick to populate the field and submit", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "AAPL" }));

    expect(screen.getByLabelText("Stock ticker symbol")).toHaveValue("AAPL");
    await waitFor(() =>
      expect(mockedFetchStockSummary).toHaveBeenCalledWith(
        "AAPL",
        expect.any(AbortSignal),
      ),
    );
  });
});
