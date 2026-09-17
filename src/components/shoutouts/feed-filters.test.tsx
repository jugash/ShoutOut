import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FeedFilters } from "./feed-filters";

const options = {
  cards: [{ id: "c1", title: "Thank You" }],
  values: [{ id: "v1", name: "Integrity" }],
};

describe("FeedFilters", () => {
  it("is collapsed with empty fields when no filters are active", () => {
    const { container } = render(
      <FeedFilters options={options} initial={{}} person={null} active={false} />,
    );
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.queryByText("On")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clear" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Value", { selector: "select" })).toHaveValue("");
  });

  it("starts open with the current filters and submits them", async () => {
    const people = [{ id: "u2", name: "Carol Chen", email: "carol@x.io" }];
    const { container } = render(
      <FeedFilters
        options={options}
        initial={{ value: "v1", card: "c1", from: "2026-09-01", to: "2026-09-30", q: "thanks" }}
        person={people[0]}
        active
        search={async () => people}
      />,
    );
    expect(container.querySelector("details")).toHaveAttribute("open");
    expect(screen.getByText("On")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear" })).toHaveAttribute("href", "/");
    const form = container.querySelector("form")!;
    expect(form).toHaveAttribute("method", "get");
    expect(Object.fromEntries(new FormData(form))).toEqual({
      q: "thanks",
      person: "u2",
      value: "v1",
      card: "c1",
      from: "2026-09-01",
      to: "2026-09-30",
    });
    await userEvent.click(screen.getByRole("button", { name: "Remove Carol Chen" }));
    expect(new FormData(form).get("person")).toBeNull();
    const combobox = screen.getByRole("combobox", { name: /person/i });
    await userEvent.click(combobox);
    fireEvent.mouseDown(await screen.findByRole("option", { name: /Carol Chen/ }));
    expect(new FormData(form).get("person")).toBe("u2");
    expect(combobox).toBeDisabled();
    expect(combobox).toHaveAttribute("placeholder", "");
  });
});
