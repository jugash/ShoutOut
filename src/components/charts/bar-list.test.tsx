import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarList } from "./bar-list";

describe("BarList", () => {
  it("shows an empty state", () => {
    render(<BarList title="Values" unit="shoutouts" items={[]} />);
    expect(screen.getByText("No data yet.")).toBeInTheDocument();
  });

  it("draws bars relative to the largest, with share on hover and focus", () => {
    render(
      <BarList
        title="Values"
        unit="shoutouts"
        items={[
          { id: "a", name: "Integrity", count: 6 },
          { id: "b", name: "Diversity", count: 3 },
          { id: "c", name: "Excellence", count: 0 },
        ]}
      />,
    );
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveAccessibleName("Integrity: 6 shoutouts, 67%");
    const bar = (row: HTMLElement) => row.querySelector(".bg-chart-mark")!;
    expect(bar(rows[0])).toHaveStyle({ width: "85%" });
    expect(bar(rows[1])).toHaveStyle({ width: "42.5%" });

    fireEvent.pointerEnter(rows[1]);
    expect(screen.getByRole("tooltip")).toHaveTextContent("3 shoutouts · 33% of 9");
    expect(bar(rows[1])).toHaveClass("opacity-80");
    fireEvent.pointerLeave(rows[1]);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.focus(rows[2]);
    expect(screen.getByRole("tooltip")).toHaveTextContent("0 shoutouts · 0% of 9");
    fireEvent.blur(rows[2]);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("handles all-zero counts", () => {
    render(
      <BarList title="Cards" unit="shoutouts" items={[{ id: "a", name: "Mentor", count: 0 }]} />,
    );
    expect(screen.getByRole("listitem").querySelector(".bg-chart-mark")).toHaveStyle({
      width: "0px",
    });
  });
});
