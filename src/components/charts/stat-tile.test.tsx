import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatTile } from "./stat-tile";

describe("StatTile", () => {
  it("shows a value with an increase", () => {
    render(<StatTile label="Shoutouts sent" value={12900} change={25} hint="Nice" />);
    expect(screen.getByText("Shoutouts sent")).toBeInTheDocument();
    expect(screen.getByText("12.9K")).toBeInTheDocument();
    expect(screen.getByText("+25%").parentElement).toHaveTextContent("▲ +25% vs previous period");
    expect(screen.getByText("+25%")).toHaveClass("text-leaf-strong");
    expect(screen.getByText("Nice")).toBeInTheDocument();
  });

  it("shows decreases, no change and missing comparisons", () => {
    const { rerender } = render(
      <StatTile label="x" value={5} change={-10} changeLabel="vs last month" />,
    );
    expect(screen.getByText("-10%")).toHaveClass("text-coral-strong");
    expect(screen.getByText("vs last month")).toBeInTheDocument();
    rerender(<StatTile label="x" value={5} change={0} />);
    expect(screen.getByText("0%")).toHaveClass("text-muted");
    rerender(<StatTile label="x" value={5} change={null} />);
    expect(screen.getByText("No earlier data")).toBeInTheDocument();
    rerender(<StatTile label="x" value={80} suffix="%" />);
    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.queryByText(/previous period/)).not.toBeInTheDocument();
  });
});
