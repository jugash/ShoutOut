import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FormState } from "@/app/actions/shoutouts";
import { ValueNameForm } from "./value-forms";

describe("ValueNameForm", () => {
  it("submits the name", async () => {
    const action = vi.fn(async (_s: FormState, _f: FormData): Promise<FormState> => ({
      status: "idle",
    }));
    render(
      <ValueNameForm
        action={action}
        initialName="Integrity"
        label="Rename Integrity"
        submitLabel="Rename"
      />,
    );
    const input = screen.getByLabelText("Rename Integrity");
    expect(input).toHaveValue("Integrity");
    expect(input).not.toHaveAttribute("aria-invalid");
    await userEvent.clear(input);
    await userEvent.type(input, "Honesty");
    await userEvent.click(screen.getByRole("button", { name: "Rename" }));
    expect(action.mock.calls[0][1].get("name")).toBe("Honesty");
  });

  it("shows the field error, or the general message", async () => {
    const action = vi
      .fn()
      .mockResolvedValueOnce({
        status: "error",
        message: "Check fields",
        fieldErrors: { name: "Give the value a name" },
      })
      .mockResolvedValueOnce({
        status: "error",
        message: "That value doesn't exist",
        fieldErrors: {},
      });
    render(<ValueNameForm action={action} label="New value name" submitLabel="Add value" />);
    await userEvent.click(screen.getByRole("button", { name: "Add value" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Give the value a name");
    expect(screen.getByLabelText("New value name")).toHaveAttribute("aria-invalid", "true");
    await userEvent.click(screen.getByRole("button", { name: "Add value" }));
    expect(await screen.findByText("That value doesn't exist")).toBeInTheDocument();
  });
});
