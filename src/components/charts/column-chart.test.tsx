import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ColumnChart } from "./column-chart";

const points = Array.from({ length: 13 }, (_, i) => ({
  label: `Week ${i + 1}`,
  tick: `W${i + 1}`,
  value: i === 2 ? 7 : 1,
}));

describe("ColumnChart", () => {
  it("draws one column per point scaled to a nice axis", () => {
    render(<ColumnChart title="Shoutouts per week" unit="shoutouts" points={points} />);
    const list = screen.getByRole("list", { name: "Shoutouts per week" });
    const columns = within(list).getAllByRole("listitem");
    expect(columns).toHaveLength(13);
    expect(columns[2]).toHaveAccessibleName("Week 3: 7 shoutouts");
    expect(columns[2].firstElementChild).toHaveStyle({ height: "70%" });
    // Axis ticks for a max of 10 and every third label shown.
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("W1")).toBeInTheDocument();
    expect(screen.queryByText("W2")).not.toBeInTheDocument();
    expect(screen.getByText("W4")).toBeInTheDocument();
  });

  it("shows a tooltip on hover and focus", () => {
    render(<ColumnChart title="t" unit="shoutouts" points={points} />);
    const column = screen.getAllByRole("listitem")[2];
    fireEvent.pointerEnter(column);
    expect(screen.getByRole("tooltip")).toHaveTextContent("7 shoutoutsWeek 3");
    expect(column.firstElementChild).toHaveClass("opacity-80");
    fireEvent.pointerLeave(column);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.focus(column);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.blur(column);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("offers a table view and copes with all-zero data and fractional ticks", () => {
    const { rerender } = render(
      <ColumnChart title="t" unit="shoutouts" points={[{ label: "Jan", tick: "J", value: 0 }]} />,
    );
    expect(screen.getByText("View as table")).toBeInTheDocument();
    expect(screen.getByRole("table")).toHaveTextContent("Jan0");
    expect(screen.getByText("0.5")).toBeInTheDocument();
    rerender(
      <ColumnChart title="t" unit="shoutouts" points={[{ label: "Jan", tick: "J", value: 5 }]} />,
    );
    expect(screen.getByText("2.5")).toBeInTheDocument();
  });
});
