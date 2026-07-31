interface EmptyStateProps {
  symbol?: string;
}

export function EmptyState({ symbol }: EmptyStateProps) {
  if (!symbol) {
    return (
      <section className="initial-state" aria-labelledby="initial-state-title">
        <div className="initial-state-copy">
          <h2 id="initial-state-title">Search a stock symbol to begin</h2>
          <p>
            Enter any valid ticker above to view the last month of daily
            averages and volume.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="status-state empty-state">
      <span className="state-icon" aria-hidden="true">
        0
      </span>
      <div>
        <h2>{`No recent records for ${symbol}`}</h2>
        <p>
          The request succeeded, but no daily market data was returned.
        </p>
      </div>
    </div>
  );
}
