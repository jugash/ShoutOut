import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OrderButtons } from "./order-buttons";

describe("OrderButtons", () => {
  it("moves and retires, disabling moves at the ends", async () => {
    const move = vi.fn(async (_d: "up" | "down") => {});
    const setActive = vi.fn(async (_a: boolean) => {});
    const { rerender } = render(
      <OrderButtons name="Mentor" first last={false} active move={move} setActive={setActive} />,
    );
    expect(screen.getByRole("button", { name: "Move Mentor up" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Move Mentor down" }));
    expect(move).toHaveBeenCalledWith("down", expect.any(FormData));
    await userEvent.click(screen.getByRole("button", { name: "Retire" }));
    expect(setActive).toHaveBeenCalledWith(false, expect.any(FormData));

    rerender(
      <OrderButtons
        name="Mentor"
        first={false}
        last
        active={false}
        move={move}
        setActive={setActive}
      />,
    );
    expect(screen.getByRole("button", { name: "Move Mentor down" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Move Mentor up" }));
    expect(move).toHaveBeenLastCalledWith("up", expect.any(FormData));
    await userEvent.click(screen.getByRole("button", { name: "Restore" }));
    expect(setActive).toHaveBeenLastCalledWith(true, expect.any(FormData));
  });
});
