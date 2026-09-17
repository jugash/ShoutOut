import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, avatarTone, initials } from "./avatar";

describe("initials", () => {
  it("uses first and last name initials", () => {
    expect(initials("Alice Anders")).toBe("AA");
    expect(initials("  carol  de la Cruz ")).toBe("CC");
    expect(initials("Bob")).toBe("B");
  });

  it("falls back to ? for empty names", () => {
    expect(initials("")).toBe("?");
    expect(initials(null)).toBe("?");
    expect(initials(undefined)).toBe("?");
  });
});

describe("avatarTone", () => {
  it("is stable per name", () => {
    expect(avatarTone("Alice Anders")).toBe(avatarTone("Alice Anders"));
    expect(avatarTone(null)).toMatch(/^bg-/);
  });

  it("spreads names across tones", () => {
    const tones = new Set(
      ["Alice", "Bob", "Carol", "Dave", "Erin", "Frank", "Grace", "Henry"].map(avatarTone),
    );
    expect(tones.size).toBeGreaterThan(2);
  });
});

describe("Avatar", () => {
  it("renders initials with an accessible name", () => {
    render(<Avatar name="Dave Diaz" size="lg" className="ring-2" />);
    const avatar = screen.getByRole("img", { name: "Dave Diaz" });
    expect(avatar).toHaveTextContent("DD");
    expect(avatar.className).toContain("size-14");
    expect(avatar.className).toContain("ring-2");
  });

  it("describes unknown people", () => {
    render(<Avatar name={undefined} />);
    expect(screen.getByRole("img", { name: "Unknown person" })).toHaveTextContent("?");
  });
});
