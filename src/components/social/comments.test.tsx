import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CommentFormState } from "@/app/actions/social";
import { CommentForm, CommentList } from "./comments";

const now = new Date("2026-09-17T12:00:00Z");

describe("CommentList", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an empty state", () => {
    render(<CommentList comments={[]} deleteAction={vi.fn()} />);
    expect(screen.getByText("No comments yet. Add some cheer!")).toBeInTheDocument();
  });

  it("lists comments and lets authors delete theirs after confirming", async () => {
    const deleteAction = vi.fn(async (_id: string) => {});
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    render(
      <CommentList
        now={now}
        deleteAction={deleteAction}
        comments={[
          {
            id: "c1",
            body: "Mine",
            createdAt: new Date("2026-09-17T11:00:00Z"),
            author: { id: "u1", name: "Me" },
            canDelete: true,
          },
          {
            id: "c2",
            body: "Theirs",
            createdAt: now,
            author: { id: "u2", name: "Bob" },
            canDelete: false,
          },
        ]}
      />,
    );
    expect(screen.getByText("1h ago")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteAction).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(deleteAction).toHaveBeenCalledWith("c1", expect.any(FormData));
  });

  it("defaults the current time", () => {
    render(
      <CommentList
        deleteAction={vi.fn()}
        comments={[
          {
            id: "c1",
            body: "Hi",
            createdAt: new Date(),
            author: { id: "u", name: "A" },
            canDelete: false,
          },
        ]}
      />,
    );
    expect(screen.getByText("just now")).toBeInTheDocument();
  });
});

describe("CommentForm", () => {
  it("posts and clears the form when saved", async () => {
    const action = vi.fn(async (_s: CommentFormState, _f: FormData): Promise<CommentFormState> => ({
      status: "saved",
      savedAt: 1,
    }));
    render(<CommentForm action={action} />);
    const box = screen.getByLabelText("Add a comment");
    await userEvent.type(box, "Great job");
    await userEvent.click(screen.getByRole("button", { name: "Post comment" }));
    expect(action.mock.calls[0][1].get("body")).toBe("Great job");
    await waitFor(() => expect(box).toHaveValue(""));
    expect(box).not.toHaveAttribute("aria-invalid");
  });

  it("shows errors and keeps the text", async () => {
    const action = vi.fn(async (): Promise<CommentFormState> => ({
      status: "error",
      message: "That shoutout doesn't exist",
      fieldErrors: {},
    }));
    render(<CommentForm action={action} />);
    const box = screen.getByLabelText("Add a comment");
    await userEvent.type(box, "Hello");
    await userEvent.click(screen.getByRole("button", { name: "Post comment" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That shoutout doesn't exist");
    expect(box).toHaveValue("Hello");
    expect(box).toHaveAttribute("aria-invalid", "true");
  });
});
