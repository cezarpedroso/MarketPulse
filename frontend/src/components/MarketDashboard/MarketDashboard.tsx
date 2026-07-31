import { useMemo } from "react";
import type { DailyStockSummary } from "../../types/stock";
import { formatDateRange } from "../../utils/formatters";
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
        <h2 id="dashboard-title">{symbol}</h2>
        <p className="dashboard-meta">
          <span>{formatDateRange(summary.startDay, summary.endDay)}</span>
          <span aria-hidden="true">{"\u00b7"}</span>
          <span>
            {summary.tradingDays} trading{" "}
            {summary.tradingDays === 1 ? "day" : "days"}
          </span>
        </p>
      </header>

      <SummaryCards summary={summary} />
      <div className="dashboard-data-grid">
        <StockChart results={results} />
        <ResultsTable results={results} />
      </div>
    </section>
  );
}
