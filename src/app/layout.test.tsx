import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Nunito: () => ({ variable: "font-nunito" }),
  Fredoka: () => ({ variable: "font-fredoka" }),
}));
const getThemePreference = vi.fn();
vi.mock("@/lib/theme-server", () => ({ getThemePreference }));

const { default: RootLayout, metadata, viewport } = await import("./layout");

describe("RootLayout", () => {
  it("applies brand fonts and an explicit theme", async () => {
    getThemePreference.mockResolvedValue("dark");
    const tree = await RootLayout({ children: <p>child</p>, params: Promise.resolve({}) });
    expect(tree.type).toBe("html");
    expect(tree.props.className).toContain("font-nunito");
    expect(tree.props.className).toContain("font-fredoka");
    expect(tree.props["data-theme"]).toBe("dark");
  });

  it("follows the OS theme by default", async () => {
    getThemePreference.mockResolvedValue("system");
    const tree = await RootLayout({ children: <p>child</p>, params: Promise.resolve({}) });
    expect(tree.props["data-theme"]).toBeUndefined();
  });

  it("sets metadata", () => {
    expect(metadata.title).toEqual({ default: "ShoutOut", template: "%s · ShoutOut" });
    expect(viewport.themeColor).toHaveLength(2);
  });
});
