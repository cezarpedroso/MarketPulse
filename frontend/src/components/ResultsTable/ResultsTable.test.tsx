import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { DailyStockSummary } from "../../types/stock";
import { ResultsTable } from "./ResultsTable";

const createResult = (
  day: string,
  lowAverage: number | null = 100.12345,
  highAverage: number | null = 110.98765,
  volume = 1_234_567,
): DailyStockSummary => ({
  day,
  lowAverage,
  highAverage,
  volume,
});

describe("ResultsTable", () => {
  it("renders the successful daily-data contract semantically", () => {
    render(<ResultsTable results={[createResult("2024-05-31")]} />);

    expect(
      screen.getByRole("columnheader", { name: "Date" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Average low (USD)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("100.1235")).toBeInTheDocument();
    expect(screen.getByText("110.9877")).toBeInTheDocument();
    expect(screen.getByText("1,234,567")).toBeInTheDocument();
  });

  it("renders null averages as em dashes", () => {
    render(
      <ResultsTable
        results={[createResult("2024-05-31", null, null)]}
      />,
    );

    expect(screen.getAllByText("\u2014")).toHaveLength(2);
  });

  it("orders dates descending without mutating the input", () => {
    const results = [
      createResult("2024-05-01"),
      createResult("2024-05-03"),
      createResult("2024-05-02"),
    ];

    render(<ResultsTable results={results} />);

    const dataRows = screen.getAllByRole("row").slice(1);

    expect(within(dataRows[0]).getByText("May 3, 2024")).toBeInTheDocument();
    expect(within(dataRows[1]).getByText("May 2, 2024")).toBeInTheDocument();
    expect(within(dataRows[2]).getByText("May 1, 2024")).toBeInTheDocument();
    expect(results.map((result) => result.day)).toEqual([
      "2024-05-01",
      "2024-05-03",
      "2024-05-02",
    ]);
  });

  it("paginates more than ten rows", async () => {
    const user = userEvent.setup();
    const results = Array.from({ length: 12 }, (_, index) =>
      createResult(`2024-05-${String(index + 1).padStart(2, "0")}`),
    );

    render(<ResultsTable results={results} />);

    expect(screen.getAllByRole("row")).toHaveLength(11);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("May 12, 2024")).toBeInTheDocument();
    expect(screen.queryByText("May 1, 2024")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("May 1, 2024")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next page" }),
    ).toBeDisabled();
  });
});
