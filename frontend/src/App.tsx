import { useEffect, useRef, useState } from "react";
import { EmptyState } from "./components/EmptyState/EmptyState";
import { ErrorState } from "./components/ErrorState/ErrorState";
import { Header } from "./components/Header/Header";
import { LoadingState } from "./components/LoadingState/LoadingState";
import { MarketDashboard } from "./components/MarketDashboard/MarketDashboard";
import { SearchForm } from "./components/SearchForm/SearchForm";
import { fetchStockSummary, StockApiError } from "./services/stockApi";
import type { DailyStockSummary } from "./types/stock";

const SYMBOL_PATTERN = /^[A-Z0-9.-]{1,10}$/;

type RequestError = {
  title: string;
  message: string;
};

const normalizeSymbol = (
  input: string,
): { symbol: string; error: string | null } => {
  const symbol = input.trim().toUpperCase();

  if (!symbol) {
    return { symbol, error: "Enter a stock ticker symbol." };
  }

  if (symbol.length > 10) {
    return {
      symbol,
      error: "Stock symbols can be no longer than 10 characters.",
    };
  }

  if (!SYMBOL_PATTERN.test(symbol)) {
    return {
      symbol,
      error: "Use only letters, numbers, periods, and hyphens.",
    };
  }

  return { symbol, error: null };
};

const getRequestError = (
  error: unknown,
  symbol: string,
): RequestError => {
  if (!(error instanceof StockApiError)) {
    return {
      title: "Unable to load market data",
      message: "Something went wrong. Please try again.",
    };
  }

  switch (error.status) {
    case 400:
      return {
        title: "Invalid stock symbol",
        message:
          "Use a ticker with 1-10 letters, numbers, periods, or hyphens.",
      };
    case 404:
      return {
        title: "Stock data not found",
        message: `We couldn't find market data for ${symbol}. Check the ticker and try again.`,
      };
    case 502:
      return {
        title: "Market data is unavailable",
        message:
          "The market data provider is temporarily unavailable. Please try again shortly.",
      };
    case 504:
      return {
        title: "The request timed out",
        message:
          "The market data provider took too long to respond. Please try again.",
      };
    default:
      return {
        title: "Unable to load market data",
        message:
          "MarketPulse could not complete the request. Please try again.",
      };
  }
};

export default function App() {
  const [symbol, setSymbol] = useState("");
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<RequestError | null>(null);
  const [results, setResults] = useState<DailyStockSummary[] | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => activeRequest.current?.abort();
  }, []);

  const handleSymbolChange = (nextSymbol: string) => {
    setSymbol(nextSymbol);
    setValidationError(null);
  };

  const handleSubmit = async (input: string) => {
    const normalized = normalizeSymbol(input);

    if (normalized.error) {
      setValidationError(normalized.error);
      return;
    }

    if (loadingSymbol === normalized.symbol) {
      return;
    }

    setSymbol(normalized.symbol);
    setValidationError(null);
    setRequestError(null);
    setResults(null);
    setActiveSymbol(normalized.symbol);
    setLoadingSymbol(normalized.symbol);

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;

    try {
      const data = await fetchStockSummary(
        normalized.symbol,
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setResults(data);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setRequestError(getRequestError(error, normalized.symbol));
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoadingSymbol(null);
      }
    }
  };

  return (
    <>
      <Header>
        <SearchForm
          symbol={symbol}
          validationError={validationError}
          loadingSymbol={loadingSymbol}
          onSymbolChange={handleSymbolChange}
          onSubmit={handleSubmit}
        />
      </Header>
      <main>
        <section className="content-section" aria-label="Market data results">
          {loadingSymbol && <LoadingState symbol={loadingSymbol} />}
          {!loadingSymbol && requestError && (
            <ErrorState
              title={requestError.title}
              message={requestError.message}
            />
          )}
          {!loadingSymbol && !requestError && results === null && (
            <EmptyState />
          )}
          {!loadingSymbol &&
            !requestError &&
            results !== null &&
            results.length === 0 && (
              <EmptyState symbol={activeSymbol ?? undefined} />
            )}
          {!loadingSymbol &&
            !requestError &&
            results !== null &&
            results.length > 0 &&
            activeSymbol && (
              <MarketDashboard symbol={activeSymbol} results={results} />
            )}
        </section>
      </main>
    </>
  );
}
