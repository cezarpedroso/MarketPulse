import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { DailyStockSummary } from "../../types/stock";
import {
  formatAverage,
  formatChartDate,
  formatDate,
  formatDateRange,
} from "../../utils/formatters";
import { toChartData } from "../../utils/stockData";

interface StockChartProps {
  results: DailyStockSummary[];
}

function ChartTooltip({
  active,
  label,
  payload,
}: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length || typeof label !== "string") {
    return null;
  }

  return (
    <div className="chart-tooltip" role="status" aria-live="polite">
      <p>{formatDate(label)}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey?.toString() ?? entry.name}>
          <span
            className="tooltip-swatch"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span>{entry.name}</span>
          <strong>
            {typeof entry.value === "number"
              ? formatAverage(entry.value)
              : "\u2014"}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function StockChart({ results }: StockChartProps) {
  const chartData = useMemo(() => toChartData(results), [results]);
  const startDay = chartData[0]?.day ?? "";
  const endDay = chartData.at(-1)?.day ?? "";
  const missingLowCount = chartData.filter(
    (point) => point.lowAverage === null,
  ).length;
  const missingHighCount = chartData.filter(
    (point) => point.highAverage === null,
  ).length;
  const missingSummary =
    missingLowCount + missingHighCount > 0
      ? ` ${missingLowCount} low and ${missingHighCount} high averages are missing and appear as gaps.`
      : "";
  const chartSummary = `Average high and low prices across ${chartData.length} trading days, ${formatDateRange(startDay, endDay)}.${missingSummary}`;

  return (
    <section className="chart-section" aria-labelledby="chart-title">
      <div className="panel-heading">
        <h3 id="chart-title">Daily average high and low</h3>
      </div>

      <p className="chart-summary visually-hidden" id="chart-summary">
        {chartSummary}
      </p>

      <div className="chart-container" aria-describedby="chart-summary">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 4, right: 20, bottom: 22, left: 8 }}
            accessibilityLayer
          >
            <CartesianGrid
              stroke="var(--chart-grid)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickFormatter={formatChartDate}
              minTickGap={44}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-axis-line)" }}
              label={{
                value: "Date",
                position: "insideBottom",
                offset: -12,
                fill: "var(--chart-axis-label)",
              }}
            />
            <YAxis
              width={68}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
              label={{
                value: "Price (USD)",
                angle: -90,
                position: "insideLeft",
                fill: "var(--chart-axis-label)",
              }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--chart-cursor)", strokeWidth: 1 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={34}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="highAverage"
              name="Average High"
              stroke="var(--chart-high)"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                stroke: "var(--chart-active-dot)",
                strokeWidth: 2,
              }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="lowAverage"
              name="Average Low"
              stroke="var(--chart-low)"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                stroke: "var(--chart-active-dot)",
                strokeWidth: 2,
              }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
