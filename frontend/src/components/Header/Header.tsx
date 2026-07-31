import type { ReactNode } from "react";
import brandLogo from "../../assets/stockapplogo.png";

interface HeaderProps {
  children: ReactNode;
}

export function Header({ children }: HeaderProps) {
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
        {children}
      </div>
    </header>
  );
}
