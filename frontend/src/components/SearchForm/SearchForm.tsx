import type { FormEvent } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { QUICK_PICK_SYMBOLS } from "../../constants/stockSymbols";

interface SearchFormProps {
  symbol: string;
  validationError: string | null;
  loadingSymbol: string | null;
  onSymbolChange: (symbol: string) => void;
  onSubmit: (symbol: string) => void;
}

export function SearchForm({
  symbol,
  validationError,
  loadingSymbol,
  onSymbolChange,
  onSubmit,
}: SearchFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(symbol);
  };

  const handleQuickPick = (quickPick: string) => {
    onSymbolChange(quickPick);
    onSubmit(quickPick);
  };

  return (
    <div className="header-search">
      <form
        className="search-form"
        onSubmit={handleSubmit}
        noValidate
        aria-label="Analyze a stock symbol"
      >
        <label className="visually-hidden" htmlFor="stock-symbol">
          Stock ticker symbol
        </label>
        <div className="search-control">
          <input
            id="stock-symbol"
            name="symbol"
            type="text"
            value={symbol}
            maxLength={10}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={validationError !== null}
            aria-describedby={validationError ? "symbol-error" : undefined}
            placeholder="e.g. AAPL"
            onChange={(event) => onSymbolChange(event.target.value)}
          />
          <button type="submit" disabled={loadingSymbol !== null}>
            {loadingSymbol ? (
              <LoaderCircle
                className="button-spinner"
                size={17}
                aria-hidden="true"
              />
            ) : (
              <Search size={17} aria-hidden="true" />
            )}
            <span>{loadingSymbol ? "Analyzing..." : "Analyze Stock"}</span>
          </button>
        </div>

        {validationError && (
          <p className="field-error" id="symbol-error" role="alert">
            {validationError}
          </p>
        )}

        <div className="quick-picks" aria-label="Popular stock symbols">
          <span>Quick picks</span>
          {QUICK_PICK_SYMBOLS.map((quickPick) => (
            <button
              key={quickPick}
              type="button"
              disabled={loadingSymbol !== null}
              onClick={() => handleQuickPick(quickPick)}
            >
              {quickPick}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
