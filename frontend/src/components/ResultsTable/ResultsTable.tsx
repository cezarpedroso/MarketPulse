import { useEffect, useMemo, useState } from "react";
import type { DailyStockSummary } from "../../types/stock";
import {
  formatAverage,
  formatDate,
  formatVolume,
} from "../../utils/formatters";
import { sortByDayDescending } from "../../utils/stockData";

interface ResultsTableProps {
  results: DailyStockSummary[];
}

const ROWS_PER_PAGE = 10;

export function ResultsTable({ results }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const orderedResults = useMemo(
    () => sortByDayDescending(results),
    [results],
  );
  const totalPages = Math.ceil(orderedResults.length / ROWS_PER_PAGE);
  const pageStart = (currentPage - 1) * ROWS_PER_PAGE;
  const pageResults = orderedResults.slice(
    pageStart,
    pageStart + ROWS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  return (
    <section className="table-section" aria-labelledby="table-title">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Daily breakdown</span>
          <h3 id="table-title">Daily trading data</h3>
        </div>
        <span className="result-count">
          {results.length} trading {results.length === 1 ? "day" : "days"}
        </span>
      </div>

      <div className="table-scroll">
        <table>
          <caption className="visually-hidden">
            Daily average low, average high, and volume by trading date
          </caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col" className="numeric">Average Low (USD)</th>
              <th scope="col" className="numeric">Average High (USD)</th>
              <th scope="col" className="numeric">Volume (Shares)</th>
            </tr>
          </thead>
          <tbody>
            {pageResults.map((result) => (
              <tr key={result.day}>
                <td>
                  <time dateTime={result.day}>{formatDate(result.day)}</time>
                </td>
                <td className="numeric">
                  {formatAverage(result.lowAverage)}
                </td>
                <td className="numeric">
                  {formatAverage(result.highAverage)}
                </td>
                <td className="numeric">{formatVolume(result.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="pagination" aria-label="Table pagination">
        <button
          type="button"
          onClick={() => setCurrentPage((page) => page - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span aria-live="polite">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setCurrentPage((page) => page + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
