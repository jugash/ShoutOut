import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const redirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});
const searchPeople = vi.fn();

vi.mock("@/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));
vi.mock("@/server/users/search", () => ({ searchPeople }));
vi.mock("@/components/layout/app-header", () => ({ AppHeader: () => <header /> }));
vi.mock("@/components/people/people-search", () => ({
  PeopleSearch: ({ initialQuery }: { initialQuery: string }) => <p>search for “{initialQuery}”</p>,
}));

const { default: PeoplePage, metadata } = await import("./page");
const props = (q?: string | string[]) =>
  ({
    params: Promise.resolve({}),
    searchParams: Promise.resolve(q === undefined ? {} : { q }),
  }) as PageProps<"/people">;

describe("PeoplePage", () => {
  beforeEach(() => {
    auth.mockResolvedValue({ user: { id: "u1", roles: [] } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous visitors", async () => {
    auth.mockResolvedValue(null);
    await expect(PeoplePage(props())).rejects.toThrow("NEXT_REDIRECT");
  });

  it("lists people, marking you, and announces the count", async () => {
    searchPeople.mockResolvedValue([
      { id: "u1", name: "Bob Baker", email: "bob@x" },
      { id: "u2", name: "Carol Chen", email: "carol@x" },
    ]);
    render(await PeoplePage(props("ca")));
    expect(metadata.title).toBe("People");
    expect(searchPeople).toHaveBeenCalledWith({}, "u1", "ca", 60, { includeSelf: true });
    expect(screen.getByText("search for “ca”")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bob Baker\s*\(you\)/ })).toHaveAttribute(
      "href",
      "/people/u1",
    );
    expect(screen.getByRole("link", { name: /Carol Chen/ })).toHaveAttribute("href", "/people/u2");
    expect(screen.getByText("2 people found")).toBeInTheDocument();
  });

  it("shows when nobody matches and ignores repeated params", async () => {
    searchPeople.mockResolvedValue([{ id: "u3", name: "Zed", email: "z@x" }]);
    render(await PeoplePage(props("zed")));
    expect(screen.getByText("1 person found")).toBeInTheDocument();
    searchPeople.mockResolvedValue([]);
    render(await PeoplePage(props(["a", "b"])));
    expect(searchPeople).toHaveBeenLastCalledWith({}, "u1", "", 60, { includeSelf: true });
    expect(screen.getByText(/Nobody matches/)).toBeInTheDocument();
  });
});
