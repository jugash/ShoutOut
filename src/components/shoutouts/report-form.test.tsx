import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FormState } from "@/app/actions/shoutouts";
import { ReportForm } from "./report-form";

const reasons = [
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Something else" },
];

describe("ReportForm", () => {
  it("submits a reason and note", async () => {
    const action = vi.fn(async (_s: FormState, _f: FormData): Promise<FormState> => ({
      status: "idle",
    }));
    render(<ReportForm action={action} reasons={reasons} cancelHref="/shoutouts/s1" />);
    await userEvent.click(screen.getByLabelText("Spam"));
    await userEvent.type(screen.getByLabelText(/Anything else/), "Duplicate");
    await userEvent.click(screen.getByRole("button", { name: "Report shoutout" }));
    expect(Object.fromEntries(action.mock.calls[0][1].entries())).toEqual({
      reason: "SPAM",
      note: "Duplicate",
    });
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/shoutouts/s1");
  });

  it("shows errors", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: { reason: "Pick a reason", note: "Too long" },
    }));
    render(<ReportForm action={action} reasons={reasons} cancelHref="/" />);
    await userEvent.click(screen.getByRole("button", { name: "Report shoutout" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please check");
    expect(screen.getByText("Pick a reason")).toBeInTheDocument();
    expect(screen.getByText("Too long")).toBeInTheDocument();
  });
});
