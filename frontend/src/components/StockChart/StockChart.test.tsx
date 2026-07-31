import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    name,
    stroke,
  }: {
    dataKey: string;
    connectNulls: boolean;
    name: string;
    stroke: string;
  }) => (
    <div
      data-testid={`line-${dataKey}`}
      data-connect-nulls={String(connectNulls)}
      data-series-name={name}
      data-stroke={stroke}
    />
  ),
}));

describe("StockChart", () => {
  beforeEach(() => {
    chartDataSpy.mockClear();
    document.documentElement.removeAttribute("data-theme");
  });

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

    const summary = screen.getByText(
      /Average high and low prices across 3 trading days/,
    );

    expect(summary).toHaveTextContent("May 1");
    expect(summary).toHaveTextContent(
      "1 low and 1 high averages are missing and appear as gaps.",
    );
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
    expect(screen.getByTestId("line-highAverage")).toHaveAttribute(
      "data-series-name",
      "Average High",
    );
    expect(screen.getByTestId("line-highAverage")).toHaveAttribute(
      "data-stroke",
      "var(--chart-high)",
    );
    expect(screen.getByTestId("line-lowAverage")).toHaveAttribute(
      "data-connect-nulls",
      "false",
    );
    expect(screen.getByTestId("line-lowAverage")).toHaveAttribute(
      "data-series-name",
      "Average Low",
    );
    expect(screen.getByTestId("line-lowAverage")).toHaveAttribute(
      "data-stroke",
      "var(--chart-low)",
    );
  });

  it.each(["light", "dark"] as const)(
    "keeps an accessible title and description in the %s theme",
    (theme) => {
      document.documentElement.dataset.theme = theme;

      render(
        <StockChart
          results={[
            {
              day: "2024-05-01",
              lowAverage: 100,
              highAverage: 110,
              volume: 1_000,
            },
          ]}
        />,
      );

      expect(
        screen.getByRole("heading", {
          name: "Daily average high and low",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Average high and low prices across 1 trading days/),
      ).toHaveTextContent("May 1, 2024");
    },
  );
});
