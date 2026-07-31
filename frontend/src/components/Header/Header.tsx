import type { ReactNode } from "react";
import { Activity } from "lucide-react";

interface HeaderProps {
  children: ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="/" aria-label="MarketPulse home">
          <span className="brand-mark" aria-hidden="true">
            <Activity size={20} strokeWidth={2.4} />
          </span>
          <span className="brand-copy">
            <h1>MarketPulse</h1>
            <span>Explore daily trends from intraday market data</span>
          </span>
        </a>
        {children}
      </div>
    </header>
  );
}
