import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FormState } from "@/app/actions/shoutouts";
import { CardForm } from "./card-form";

const initial = { title: "", tagline: "", illustration: "heart" as const, tone: "coral" as const };

describe("CardForm", () => {
  it("previews the card as you edit and submits all fields", async () => {
    const action = vi.fn(async (_s: FormState, _f: FormData): Promise<FormState> => ({
      status: "idle",
    }));
    render(<CardForm action={action} initial={initial} submitLabel="Create card" />);
    const preview = screen.getByRole("figure");
    expect(preview).toHaveTextContent("Card title");
    expect(preview).toHaveTextContent("Short tagline");

    await userEvent.type(screen.getByLabelText("Title"), "High Five");
    await userEvent.type(screen.getByLabelText("Tagline"), "Nailed it");
    await userEvent.click(screen.getByRole("radio", { name: "party popper" }));
    await userEvent.click(screen.getByText("sky"));
    expect(preview).toHaveTextContent("High FiveNailed it");
    expect(preview).toHaveClass("bg-sky-soft");
    expect(preview.querySelector("[data-illustration]")).toHaveAttribute(
      "data-illustration",
      "party-popper",
    );

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));
    expect(Object.fromEntries(action.mock.calls[0][1].entries())).toEqual({
      title: "High Five",
      tagline: "Nailed it",
      illustration: "party-popper",
      tone: "sky",
    });
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/admin/cards");
  });

  it("shows field errors from the action", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: {
        title: "A card with that title already exists",
        tagline: "Add a short tagline",
        illustration: "Pick an illustration",
        tone: "Pick a colour",
      },
    }));
    render(
      <CardForm
        action={action}
        initial={{ title: "Thank You", tagline: "x", illustration: "trophy", tone: "leaf" }}
        submitLabel="Save card"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save card" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please check the highlighted fields.",
    );
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Tagline")).toHaveAttribute("aria-invalid", "true");
    for (const text of [
      "A card with that title already exists",
      "Add a short tagline",
      "Pick an illustration",
      "Pick a colour",
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    const colours = screen.getByRole("group", { name: "Colour" });
    expect(within(colours).getByRole("radio", { name: "leaf" })).toBeChecked();
  });
});
