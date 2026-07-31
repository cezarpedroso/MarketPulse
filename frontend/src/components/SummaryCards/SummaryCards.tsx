import type { MarketSummary } from "../../utils/stockData";
import {
  formatAverage,
  formatCompactVolume,
  formatDateRange,
} from "../../utils/formatters";

interface SummaryCardsProps {
  summary: MarketSummary;
}

interface SummaryCard {
  label: string;
  value: string;
  tone?: "low" | "high";
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards: SummaryCard[] = [
    {
      label: "Date range",
      value: formatDateRange(summary.startDay, summary.endDay),
    },
    {
      label: "Average daily low",
      value: formatAverage(summary.overallAverageLow),
      tone: "low",
    },
    {
      label: "Average daily high",
      value: formatAverage(summary.overallAverageHigh),
      tone: "high",
    },
    {
      label: "Total volume",
      value: formatCompactVolume(summary.totalVolume),
    },
  ];

  return (
    <dl className="summary-grid" aria-label="Market summary">
      {cards.map((card) => (
        <div
          className={`summary-card${card.tone ? ` summary-card-${card.tone}` : ""}`}
          key={card.label}
        >
          <dt>{card.label}</dt>
          <dd>{card.value}</dd>
        </div>
      ))}
    </dl>
  );
}
