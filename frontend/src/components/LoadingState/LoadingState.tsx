interface LoadingStateProps {
  symbol: string;
}

export function LoadingState({ symbol }: LoadingStateProps) {
  return (
    <div className="status-state" role="status" aria-live="polite">
      <span className="loading-indicator" aria-hidden="true" />
      <div>
        <h2>Loading {symbol} market data</h2>
        <p>Gathering and grouping the latest intraday records.</p>
      </div>
    </div>
  );
}
