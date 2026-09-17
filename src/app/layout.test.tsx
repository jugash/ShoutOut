import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({ Nunito: () => ({ variable: "font-nunito" }) }));

const { default: RootLayout, metadata } = await import("./layout");

describe("RootLayout", () => {
  it("wraps pages with the brand font and metadata", () => {
    const tree = RootLayout({ children: <p>child</p>, params: Promise.resolve({}) });
    expect(tree.type).toBe("html");
    expect(tree.props.className).toContain("font-nunito");
    expect(metadata.title).toBe("ShoutOut");
  });
});
