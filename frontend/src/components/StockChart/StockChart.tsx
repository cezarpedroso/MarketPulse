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
              : "—"}
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
        <div>
          <span className="eyebrow">Price movement</span>
          <h3 id="chart-title">Daily average high and low</h3>
        </div>
      </div>

      <p className="chart-summary" id="chart-summary">
        {chartSummary}
      </p>

      <div className="chart-container" aria-describedby="chart-summary">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 24, bottom: 24, left: 14 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="#dde5e1" strokeDasharray="4 4" />
            <XAxis
              dataKey="day"
              tickFormatter={formatChartDate}
              minTickGap={24}
              tick={{ fill: "#61706a", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#bdc9c4" }}
              label={{
                value: "Date",
                position: "insideBottom",
                offset: -12,
                fill: "#4e5d57",
              }}
            />
            <YAxis
              width={76}
              tick={{ fill: "#61706a", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#bdc9c4" }}
              domain={["auto", "auto"]}
              label={{
                value: "Price (USD)",
                angle: -90,
                position: "insideLeft",
                fill: "#4e5d57",
              }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              height={42}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="highAverage"
              name="Average High"
              stroke="#2f8a61"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              strokeDasharray="7 5"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="lowAverage"
              name="Average Low"
              stroke="#c55353"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
