import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { THEME_STORAGE_KEY } from "./hooks/useTheme";
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

const createDeferred = <T,>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.removeProperty("color-scheme");
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  );
  mockedFetchStockSummary.mockReset();
  mockedFetchStockSummary.mockResolvedValue(result);
});

describe("MarketPulse app", () => {
  it("defaults to the system dark theme on first load", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });

  it("toggles and persists the selected theme", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("restores a persisted theme ahead of the system preference", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("falls back to the system preference for an unsupported saved theme", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(<App />);

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  it("renders the initial state", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "MarketPulse",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Search a stock symbol to begin",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Enter any valid ticker above to view the last month of daily averages and volume.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Stock ticker symbol")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Analyze Stock" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("renders all supported quick picks", () => {
    render(<App />);

    const quickPicks = screen.getByLabelText("Popular stock symbols");

    for (const symbol of ["AAPL", "MSFT", "TSLA", "NVDA"]) {
      expect(
        within(quickPicks).getByRole("button", { name: symbol }),
      ).toBeInTheDocument();
    }
  });

  it("rejects empty input without calling the API", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Analyze Stock" }));

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent("Enter a stock ticker symbol.");
    expect(mockedFetchStockSummary).not.toHaveBeenCalled();
  });

  it("rejects unsupported characters without calling the API", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Stock ticker symbol"), "AAPL$");
    await user.click(screen.getByRole("button", { name: "Analyze Stock" }));

    expect(
      screen.getByText("Use only letters, numbers, periods, and hyphens."),
    ).toBeInTheDocument();
    expect(mockedFetchStockSummary).not.toHaveBeenCalled();
  });

  it("rejects symbols longer than ten characters", async () => {
    const user = userEvent.setup();
    render(<App />);

    fireEvent.change(screen.getByLabelText("Stock ticker symbol"), {
      target: { value: "ABCDEFGHIJK" },
    });
    await user.click(screen.getByRole("button", { name: "Analyze Stock" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Stock symbols can be no longer than 10 characters.",
    );
    expect(mockedFetchStockSummary).not.toHaveBeenCalled();
  });

  it("normalizes lowercase input and submits with Enter", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText("Stock ticker symbol");
    await user.type(input, "aapl");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(input).toHaveValue("AAPL"));
    expect(mockedFetchStockSummary).toHaveBeenCalledTimes(1);
    expect(mockedFetchStockSummary).toHaveBeenCalledWith(
      "AAPL",
      expect.any(AbortSignal),
    );
  });

  it("trims surrounding whitespace and calls the API once", async () => {
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
    expect(mockedFetchStockSummary).toHaveBeenCalledTimes(1);
  });

  it("renders an accessible loading state and disables submission controls", async () => {
    mockedFetchStockSummary.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MSFT" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading MSFT market data",
    );
    expect(
      screen.getByRole("button", { name: "Analyzing..." }),
    ).toBeDisabled();

    const quickPicks = screen.getByLabelText("Popular stock symbols");
    for (const symbol of ["AAPL", "MSFT", "TSLA", "NVDA"]) {
      expect(
        within(quickPicks).getByRole("button", { name: symbol }),
      ).toBeDisabled();
    }
  });

  it("prevents duplicate submissions while the same symbol is loading", async () => {
    mockedFetchStockSummary.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText("Stock ticker symbol");
    await user.type(input, "AAPL");
    await user.keyboard("{Enter}");
    fireEvent.submit(screen.getByRole("form", { name: "Analyze a stock symbol" }));

    expect(mockedFetchStockSummary).toHaveBeenCalledTimes(1);
  });

  it("renders the dashboard for a successful response", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "AAPL" }));

    expect(
      await screen.findByRole("heading", { name: "AAPL" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Daily average high and low" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("1 trading day")).toHaveLength(2);
  });

  it("renders an empty-data message for an empty successful response", async () => {
    mockedFetchStockSummary.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "AAPL" }));

    expect(
      await screen.findByRole("heading", {
        name: "No recent records for AAPL",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("replaces prior results when a new search succeeds", async () => {
    mockedFetchStockSummary
      .mockResolvedValueOnce(result)
      .mockResolvedValueOnce([
        {
          day: "2024-06-03",
          lowAverage: 200,
          highAverage: 210,
          volume: 500,
        },
      ]);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "AAPL" }));
    expect(
      await screen.findByRole("heading", { name: "AAPL" }),
    ).toBeInTheDocument();

    const input = screen.getByLabelText("Stock ticker symbol");
    await user.clear(input);
    await user.type(input, "MSFT");
    await user.keyboard("{Enter}");

    expect(
      await screen.findByRole("heading", { name: "MSFT" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "AAPL" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("table")).getByText("210.0000"),
    ).toBeInTheDocument();
  });

  it("renders a useful validation message for 400 responses", async () => {
    mockedFetchStockSummary.mockRejectedValue(
      new StockApiError(400, "Invalid stock symbol"),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "AAPL" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid stock symbol",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use a ticker with 1-10 letters, numbers, periods, or hyphens.",
    );
  });

  it("renders a friendly not-found message for 404 responses", async () => {
    mockedFetchStockSummary.mockRejectedValue(
      new StockApiError(404, "Stock data not found"),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "TSLA" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Stock data not found",
    );
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

  it("renders a friendly timeout message for 504 responses", async () => {
    mockedFetchStockSummary.mockRejectedValue(
      new StockApiError(504, "Upstream request timed out"),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "MSFT" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The request timed out",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The market data provider took too long to respond. Please try again.",
    );
  });

  it("renders a safe generic message for 500 responses", async () => {
    mockedFetchStockSummary.mockRejectedValue(
      new StockApiError(
        500,
        "Internal provider failure",
        "Sensitive upstream detail",
      ),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "AAPL" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load market data",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "MarketPulse could not complete the request. Please try again.",
    );
    expect(screen.queryByText(/Sensitive upstream detail/)).not.toBeInTheDocument();
  });

  it("does not expose raw unexpected exception details", async () => {
    mockedFetchStockSummary.mockRejectedValue(
      new Error("Stack trace: private implementation detail"),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "NVDA" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(
      screen.queryByText(/private implementation detail/),
    ).not.toBeInTheDocument();
  });

  it("aborts an obsolete request without rendering a false error", async () => {
    const firstRequest = createDeferred<DailyStockSummary[]>();
    let firstSignal: AbortSignal | undefined;
    mockedFetchStockSummary
      .mockImplementationOnce((_symbol, signal) => {
        firstSignal = signal;
        signal.addEventListener("abort", () => {
          firstRequest.reject(new DOMException("Aborted", "AbortError"));
        });
        return firstRequest.promise;
      })
      .mockResolvedValueOnce([
        {
          day: "2024-06-03",
          lowAverage: 200,
          highAverage: 210,
          volume: 500,
        },
      ]);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "AAPL" }));
    expect(screen.getByRole("status")).toBeInTheDocument();

    const input = screen.getByLabelText("Stock ticker symbol");
    await user.clear(input);
    await user.type(input, "MSFT");
    fireEvent.submit(screen.getByRole("form", { name: "Analyze a stock symbol" }));

    await waitFor(() => expect(firstSignal?.aborted).toBe(true));
    expect(
      await screen.findByRole("heading", { name: "MSFT" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses a quick pick to populate the field and submit once", async () => {
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
    expect(mockedFetchStockSummary).toHaveBeenCalledTimes(1);
  });
});
