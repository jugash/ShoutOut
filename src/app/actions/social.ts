"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { DomainError } from "@/server/errors";
import { addComment, commentSchema, deleteComment } from "@/server/social/comments";
import { toggleReaction } from "@/server/social/reactions";
import { fieldErrors } from "@/server/shoutouts/validation";

export type CommentFormState =
  | { status: "idle" }
  | { status: "saved"; savedAt: number }
  | { status: "error"; message: string; fieldErrors: Record<string, string> };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  return session.user.id;
}

export async function toggleReactionAction(shoutoutId: string, emoji: string): Promise<void> {
  const userId = await requireUserId();
  try {
    await toggleReaction(getDb(), userId, shoutoutId, emoji);
  } catch (error) {
    // The shoutout may have been deleted meanwhile; the refreshed page will show that.
    if (!(error instanceof DomainError)) throw error;
  }
  revalidatePath("/", "layout");
}

export async function addCommentAction(
  shoutoutId: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const userId = await requireUserId();
  const body = formData.get("body");
  const parsed = commentSchema.safeParse({ body: typeof body === "string" ? body : "" });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { status: "error", message: errors.body, fieldErrors: errors };
  }
  try {
    await addComment(getDb(), userId, shoutoutId, parsed.data.body);
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
    return { status: "error", message: error.message, fieldErrors: {} };
  }
  revalidatePath("/", "layout");
  return { status: "saved", savedAt: Date.now() };
}

export async function deleteCommentAction(commentId: string): Promise<void> {
  const userId = await requireUserId();
  try {
    await deleteComment(getDb(), userId, commentId);
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
  }
  revalidatePath("/", "layout");
}
