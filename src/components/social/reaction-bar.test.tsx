import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactionSummary } from "@/lib/reactions";
import { ReactionBar } from "./reaction-bar";

const reactions: ReactionSummary[] = [
  { key: "heart", emoji: "❤️", label: "Love", count: 1, reacted: false, names: ["Bob"] },
  {
    key: "fire",
    emoji: "🔥",
    label: "On fire",
    count: 5,
    reacted: true,
    names: ["Me", "Bob", "Carol", "Dave", "Erin"],
  },
];

describe("ReactionBar", () => {
  it("shows counts, who reacted and whether you did", () => {
    render(<ReactionBar reactions={reactions} viewerName="Me" toggle={vi.fn()} />);
    const heart = screen.getByRole("button", { name: "Love, 1" });
    expect(heart).toHaveAttribute("aria-pressed", "false");
    expect(heart).toHaveAttribute("title", "Love: Bob");
    const fire = screen.getByRole("button", { name: "On fire, 5" });
    expect(fire).toHaveAttribute("aria-pressed", "true");
    expect(fire).toHaveAttribute("title", "On fire: Me, Bob, Carol and 2 more");
  });

  it("toggles an existing reaction optimistically", async () => {
    let resolve: () => void = () => {};
    const toggle = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<ReactionBar reactions={reactions} viewerName="Me" toggle={toggle} />);
    await userEvent.click(screen.getByRole("button", { name: "Love, 1" }));
    expect(toggle).toHaveBeenCalledWith("heart");
    expect(await screen.findByRole("button", { name: "Love, 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const emoji = () => screen.getByRole("button", { name: "Love, 2" }).querySelector("span")!;
    expect(emoji()).toHaveClass("animate-reaction-pop");
    // jsdom has no AnimationEvent, so React listens for the prefixed event name.
    fireEvent(emoji(), new Event("webkitAnimationEnd", { bubbles: true }));
    expect(emoji()).not.toHaveClass("animate-reaction-pop");
    await act(async () => resolve());
  });

  it("adds a new reaction from the picker and closes it with Escape", async () => {
    const toggle = vi.fn(async () => {});
    render(<ReactionBar reactions={[]} viewerName="Me" toggle={toggle} />);
    const add = screen.getByRole("button", { name: "Add a reaction" });
    expect(add).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(add);
    expect(screen.getAllByRole("menuitem")).toHaveLength(8);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Enter" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await userEvent.click(add);
    await userEvent.click(screen.getByRole("menuitem", { name: "Rocket" }));
    expect(toggle).toHaveBeenCalledWith("rocket");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
