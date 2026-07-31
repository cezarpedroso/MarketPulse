import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
        <h3 id="table-title">Daily data</h3>
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
              <th scope="col" className="numeric">Average low (USD)</th>
              <th scope="col" className="numeric">Average high (USD)</th>
              <th scope="col" className="numeric">Volume (shares)</th>
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
          aria-label="Previous page"
          title="Previous page"
          onClick={() => setCurrentPage((page) => page - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={17} aria-hidden="true" />
        </button>
        <span aria-live="polite">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          title="Next page"
          onClick={() => setCurrentPage((page) => page + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </nav>
    </section>
  );
}
