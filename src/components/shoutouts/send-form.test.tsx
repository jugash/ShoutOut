import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FormState } from "@/app/actions/shoutouts";
import { findCardDesign } from "@/components/cards/designs";
import { SendShoutoutForm, type SendFormProps } from "./send-form";

const cards = [
  { id: "c1", design: findCardDesign("thank-you")! },
  { id: "c2", design: findCardDesign("crushed-it")! },
];
const values = [
  { id: "v1", name: "Integrity" },
  { id: "v2", name: "Excellence" },
];
const people = [
  { id: "u2", name: "Bob Baker", email: "bob@x.io" },
  { id: "u3", name: "Carol Chen", email: "carol@x.io" },
];

function setup(overrides: Partial<SendFormProps> = {}) {
  const action = vi.fn(async (_s: FormState, _f: FormData): Promise<FormState> => ({
    status: "idle",
  }));
  render(
    <SendShoutoutForm
      action={action}
      cards={cards}
      values={values}
      senderName="Alice Anders"
      remaining={5}
      maxRecipients={3}
      maxMessageLength={280}
      search={async () => people}
      {...overrides}
    />,
  );
  return action;
}

async function pick(name: string) {
  await userEvent.click(screen.getByRole("combobox"));
  fireEvent.mouseDown(await screen.findByRole("option", { name: new RegExp(name) }));
}

describe("SendShoutoutForm", () => {
  it("previews the shoutout as it is written and submits it", async () => {
    const action = setup();
    const preview = () => screen.getByRole("article");
    expect(preview()).toHaveTextContent("Your message will appear here.");
    expect(preview()).toHaveTextContent("To …");
    expect(screen.getByText("You have 5 shoutouts left this quarter.")).toBeInTheDocument();

    await pick("Bob Baker");
    await pick("Carol Chen");
    await userEvent.click(screen.getByText("Crushed It", { selector: "label span" }));
    await userEvent.click(screen.getByText("Excellence"));
    await userEvent.type(screen.getByLabelText("Say thanks"), "Nailed it");
    await userEvent.click(screen.getByText("Private"));

    expect(preview()).toHaveAccessibleName(
      "Crushed It from Alice Anders to Bob Baker and Carol Chen",
    );
    expect(preview()).toHaveTextContent("Nailed it");
    expect(preview()).toHaveTextContent("#Excellence");
    expect(screen.getByText("This uses 2 of your 5 remaining shoutouts.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Send shoutout" }));
    expect(action).toHaveBeenCalledOnce();
    const data = action.mock.calls[0][1];
    expect(data.getAll("recipientIds")).toEqual(["u2", "u3"]);
    expect(Object.fromEntries([...data.entries()].filter(([k]) => k !== "recipientIds"))).toEqual({
      cardId: "c2",
      valueId: "v2",
      message: "Nailed it",
      visibility: "PRIVATE",
    });
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/");
  });

  it("shows errors returned by the action", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: { recipientIds: "Pick at least one person", valueId: "Pick a company value" },
    }));
    setup({ action });
    await userEvent.click(screen.getByRole("button", { name: "Send shoutout" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please check the highlighted fields.",
    );
    expect(screen.getByText("Pick at least one person")).toBeInTheDocument();
    expect(screen.getByText("Pick a company value", { selector: "p" })).toBeInTheDocument();
  });

  it("limits recipients to the remaining budget", async () => {
    setup({ remaining: 1 });
    await pick("Bob Baker");
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("copes with no cards and disables sending over budget", async () => {
    setup({ cards: [], remaining: 0 });
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    await pick("Bob Baker");
    expect(screen.getByRole("button", { name: "Send shoutout" })).toBeDisabled();
  });
});
