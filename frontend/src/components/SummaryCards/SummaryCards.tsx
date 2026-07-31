import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Tag,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { MarketSummary } from "../../utils/stockData";
import {
  formatAverage,
  formatDateRange,
  formatVolume,
} from "../../utils/formatters";

interface SummaryCardsProps {
  symbol: string;
  summary: MarketSummary;
}

interface SummaryCard {
  label: string;
  value: string;
  tone: "blue" | "green" | "red" | "purple";
  icon: LucideIcon;
}

export function SummaryCards({ symbol, summary }: SummaryCardsProps) {
  const cards: SummaryCard[] = [
    { label: "Symbol", value: symbol, tone: "blue", icon: Tag },
    {
      label: "Date Range",
      value: formatDateRange(summary.startDay, summary.endDay),
      tone: "purple",
      icon: CalendarRange,
    },
    {
      label: "Trading Days",
      value: formatVolume(summary.tradingDays),
      tone: "blue",
      icon: CalendarDays,
    },
    {
      label: "Overall Average Low",
      value: formatAverage(summary.overallAverageLow),
      tone: "red",
      icon: TrendingDown,
    },
    {
      label: "Overall Average High",
      value: formatAverage(summary.overallAverageHigh),
      tone: "green",
      icon: TrendingUp,
    },
    {
      label: "Total Volume",
      value: formatVolume(summary.totalVolume),
      tone: "purple",
      icon: BarChart3,
    },
  ];

  return (
    <dl className="summary-grid" aria-label="Market summary">
      {cards.map(({ icon: Icon, ...card }) => (
        <div
          className={`summary-card summary-card-${card.tone}`}
          key={card.label}
        >
          <div className="summary-label">
            <span className="summary-icon" aria-hidden="true">
              <Icon size={16} strokeWidth={2} />
            </span>
            <dt>{card.label}</dt>
          </div>
          <dd>{card.value}</dd>
        </div>
      ))}
    </dl>
  );
}
