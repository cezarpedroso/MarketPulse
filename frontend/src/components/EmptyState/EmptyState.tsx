interface EmptyStateProps {
  symbol?: string;
}

export function EmptyState({ symbol }: EmptyStateProps) {
  return (
    <div className="status-state empty-state">
      <span className="state-icon" aria-hidden="true">
        {symbol ? "0" : "+"}
      </span>
      <div>
        <h2>{symbol ? `No recent records for ${symbol}` : "Ready when you are"}</h2>
        <p>
          {symbol
            ? "The request succeeded, but no daily market data was returned."
            : "Enter a ticker symbol or choose a quick pick to begin."}
        </p>
      </div>
    </div>
  );
}
