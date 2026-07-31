import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import brandLogo from "../../assets/stockapplogo.png";
import { useTheme } from "../../hooks/useTheme";

interface HeaderProps {
  children: ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="/" aria-label="MarketPulse home">
          <img
            className="brand-logo"
            src={brandLogo}
            alt="MarketPulse"
          />
          <div className="brand-copy visually-hidden">
            <h1>MarketPulse</h1>
            <span>Explore daily trends from intraday market data</span>
          </div>
        </a>
        <div className="header-actions">
          {children}
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
            aria-pressed={theme === "dark"}
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon size={18} aria-hidden="true" />
            ) : (
              <Sun size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
