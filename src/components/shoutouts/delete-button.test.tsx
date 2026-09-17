import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteShoutoutButton } from "./delete-button";

describe("DeleteShoutoutButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deletes only after confirmation", async () => {
    const action = vi.fn(async () => {});
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(<DeleteShoutoutButton action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/delete this shoutout/i));
    expect(action).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(action).toHaveBeenCalledOnce();
  });
});
