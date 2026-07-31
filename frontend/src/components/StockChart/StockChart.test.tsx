import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DailyStockSummary } from "../../types/stock";
import { StockChart } from "./StockChart";

const chartDataSpy = vi.hoisted(() => vi.fn());

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  LineChart: ({
    data,
    children,
  }: {
    data: unknown;
    children?: ReactNode;
  }) => {
    chartDataSpy(data);
    return <div data-testid="line-chart">{children}</div>;
  },
  CartesianGrid: () => null,
  Legend: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Line: ({
    dataKey,
    connectNulls,
  }: {
    dataKey: string;
    connectNulls: boolean;
  }) => (
    <div
      data-testid={`line-${dataKey}`}
      data-connect-nulls={String(connectNulls)}
    />
  ),
}));

describe("StockChart", () => {
  it("receives ascending chart data and preserves null averages", () => {
    const results: DailyStockSummary[] = [
      {
        day: "2024-05-03",
        lowAverage: 103,
        highAverage: null,
        volume: 300,
      },
      {
        day: "2024-05-01",
        lowAverage: null,
        highAverage: 111,
        volume: 100,
      },
      {
        day: "2024-05-02",
        lowAverage: 102,
        highAverage: 112,
        volume: 200,
      },
    ];

    render(<StockChart results={results} />);

    expect(
      screen.getByText(
        "Average high and low prices across 3 trading days, May 1, 2024 - May 3, 2024. 1 low and 1 high averages are missing and appear as gaps.",
      ),
    ).toBeInTheDocument();
    expect(chartDataSpy).toHaveBeenCalledWith([
      {
        day: "2024-05-01",
        lowAverage: null,
        highAverage: 111,
      },
      {
        day: "2024-05-02",
        lowAverage: 102,
        highAverage: 112,
      },
      {
        day: "2024-05-03",
        lowAverage: 103,
        highAverage: null,
      },
    ]);
    expect(screen.getByTestId("line-highAverage")).toHaveAttribute(
      "data-connect-nulls",
      "false",
    );
    expect(screen.getByTestId("line-lowAverage")).toHaveAttribute(
      "data-connect-nulls",
      "false",
    );
  });
});
