import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { findCardDesign } from "./designs";
import { joinNames, ShoutoutCard } from "./shoutout-card";

describe("joinNames", () => {
  it("formats recipient lists", () => {
    expect(joinNames([])).toBe("");
    expect(joinNames(["Bob"])).toBe("Bob");
    expect(joinNames(["Bob", "Carol"])).toBe("Bob and Carol");
    expect(joinNames(["Bob", "Carol", "Dave"])).toBe("Bob, Carol and Dave");
  });
});

describe("ShoutoutCard", () => {
  it("shows the card, message, people and value", () => {
    render(
      <ShoutoutCard
        design={findCardDesign("thank-you")!}
        from="Alice Anders"
        to={["Bob Baker", "Carol Chen"]}
        value="Teamwork"
        message="You two are brilliant."
      />,
    );
    const card = screen.getByRole("article", {
      name: "Thank You from Alice Anders to Bob Baker and Carol Chen",
    });
    expect(card).toHaveTextContent("You two are brilliant.");
    expect(card).toHaveTextContent("#Teamwork");
    expect(screen.getByRole("img", { name: "Alice Anders" })).toBeInTheDocument();
  });

  it("omits the value tag when there is none", () => {
    render(
      <ShoutoutCard
        design={findCardDesign("crushed-it")!}
        from="Bob"
        to={["Dave"]}
        message="Nice!"
        className="mt-2"
      />,
    );
    const card = screen.getByRole("article");
    expect(card).not.toHaveTextContent("#");
    expect(card).toHaveClass("mt-2");
  });
});
