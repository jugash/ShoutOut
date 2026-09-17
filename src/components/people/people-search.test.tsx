import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/people",
}));

const { PeopleSearch } = await import("./people-search");

describe("PeopleSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    replace.mockReset();
  });

  const box = () => screen.getByRole("searchbox", { name: "Search people" });

  it("updates the results as you type, debounced", async () => {
    render(<PeopleSearch initialQuery="" debounceMs={200} />);
    fireEvent.change(box(), { target: { value: "ca" } });
    fireEvent.change(box(), { target: { value: "car ol" } });
    expect(replace).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/people?q=car%20ol", { scroll: false });

    // Clearing the box shows everyone again.
    fireEvent.change(box(), { target: { value: "  " } });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(replace).toHaveBeenLastCalledWith("/people", { scroll: false });
  });

  it("doesn't search again for the same query and searches immediately on Enter", async () => {
    render(<PeopleSearch initialQuery="bob" />);
    expect(box()).toHaveValue("bob");
    fireEvent.change(box(), { target: { value: "bob " } });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(replace).not.toHaveBeenCalled();

    fireEvent.change(box(), { target: { value: "dave" } });
    fireEvent.submit(box().closest("form")!);
    expect(replace).toHaveBeenCalledWith("/people?q=dave", { scroll: false });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
