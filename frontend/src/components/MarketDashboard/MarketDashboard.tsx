import { useMemo } from "react";
import type { DailyStockSummary } from "../../types/stock";
import { deriveMarketSummary } from "../../utils/stockData";
import { ResultsTable } from "../ResultsTable/ResultsTable";
import { StockChart } from "../StockChart/StockChart";
import { SummaryCards } from "../SummaryCards/SummaryCards";

interface MarketDashboardProps {
  symbol: string;
  results: DailyStockSummary[];
}

export function MarketDashboard({
  symbol,
  results,
}: MarketDashboardProps) {
  const summary = useMemo(() => deriveMarketSummary(results), [results]);

  return (
    <section className="market-dashboard" aria-labelledby="dashboard-title">
      <header className="dashboard-heading">
        <div>
          <span className="eyebrow">Market overview</span>
          <h2 id="dashboard-title">{symbol}</h2>
          <p>Aggregated intraday market data overview</p>
        </div>
      </header>

      <SummaryCards symbol={symbol} summary={summary} />
      <StockChart results={results} />
      <ResultsTable results={results} />
    </section>
  );
}
