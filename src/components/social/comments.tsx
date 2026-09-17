"use client";

import { useActionState, useEffect, useState } from "react";
import type { CommentFormState } from "@/app/actions/social";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import { COMMENT_MAX_LENGTH } from "@/lib/reactions";
import type { CommentView } from "@/server/social/comments";

export function CommentList({
  comments,
  deleteAction,
  now = new Date(),
}: {
  comments: CommentView[];
  deleteAction: (commentId: string) => Promise<void>;
  now?: Date;
}) {
  if (comments.length === 0) {
    return <p className="text-muted">No comments yet. Add some cheer!</p>;
  }
  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-3">
          <Avatar name={comment.author.name} size="sm" />
          <div className="min-w-0 flex-1 rounded-2xl bg-surface-muted px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm">
                <span className="font-bold">{comment.author.name}</span>{" "}
                <time className="text-muted" dateTime={comment.createdAt.toISOString()}>
                  {formatRelativeTime(comment.createdAt, now)}
                </time>
              </p>
              {comment.canDelete && (
                <form
                  action={deleteAction.bind(null, comment.id)}
                  onSubmit={(event) => {
                    if (!window.confirm("Delete this comment?")) event.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs font-bold text-coral-strong hover:underline"
                  >
                    Delete
                  </button>
                </form>
              )}
            </div>
            <p className="mt-1 break-words whitespace-pre-line">{comment.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CommentForm({
  action,
}: {
  action: (state: CommentFormState, formData: FormData) => Promise<CommentFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  // Controlled so the text survives a failed post (React resets uncontrolled forms after actions).
  const [body, setBody] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear only after a successful save
    if (state.status === "saved") setBody("");
  }, [state]);

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor="comment-body" className="sr-only">
        Add a comment
      </label>
      <textarea
        id="comment-body"
        name="body"
        rows={2}
        maxLength={COMMENT_MAX_LENGTH}
        required
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Add a comment…"
        aria-invalid={state.status === "error" ? true : undefined}
        aria-describedby={state.status === "error" ? "comment-error" : undefined}
        className="w-full resize-y rounded-2xl border-2 border-border bg-surface p-3 placeholder:text-muted focus:border-teal focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        {state.status === "error" ? (
          <p id="comment-error" role="alert" className="text-sm font-bold text-coral-strong">
            {state.message}
          </p>
        ) : (
          <span />
        )}
        <button type="submit" disabled={pending} className={buttonClasses({ size: "sm" })}>
          {pending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
