import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MarketSummary } from "../../utils/stockData";
import { SummaryCards } from "./SummaryCards";

const summary: MarketSummary = {
  startDay: "2024-05-01",
  endDay: "2024-05-31",
  tradingDays: 3,
  overallAverageLow: 20.12346,
  overallAverageHigh: 40.98765,
  totalVolume: 1_500_000,
};

describe("SummaryCards", () => {
  it("renders derived values with the expected user-facing formatting", () => {
    render(<SummaryCards summary={summary} />);

    expect(screen.getByLabelText("Market summary")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === "DD" &&
          element.textContent?.includes("May 1") === true &&
          element.textContent.includes("31, 2024"),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("20.1235")).toBeInTheDocument();
    expect(screen.getByText("40.9877")).toBeInTheDocument();
    expect(screen.getByText("1.5M shares")).toBeInTheDocument();
  });

  it("renders missing low and high averages as em dashes", () => {
    render(
      <SummaryCards
        summary={{
          ...summary,
          overallAverageLow: null,
          overallAverageHigh: null,
        }}
      />,
    );

    expect(screen.getAllByText("\u2014")).toHaveLength(2);
    expect(screen.queryByText("0.0000")).not.toBeInTheDocument();
  });
});
