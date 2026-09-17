import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SegmentedLinks } from "./segmented-links";

describe("SegmentedLinks", () => {
  it("marks the current option", () => {
    render(
      <SegmentedLinks
        label="Period"
        current="week"
        options={[
          { value: "week", label: "This week", href: "?period=week" },
          { value: "all", label: "All time", href: "?period=all" },
        ]}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Period" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "This week" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "All time" })).not.toHaveAttribute("aria-current");
  });
});
