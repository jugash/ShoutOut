"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/app/actions/shoutouts";
import { requireAdmin } from "@/app/admin/guard";
import { getDb } from "@/lib/db";
import {
  cardSchema,
  createCard,
  createValue,
  moveCard,
  moveValue,
  renameValue,
  setCardActive,
  setValueActive,
  updateCard,
  valueSchema,
} from "@/server/admin/catalog";
import { resolveCase } from "@/server/admin/moderation";
import type { Direction } from "@/server/admin/ordering";
import { DomainError } from "@/server/errors";
import { fieldErrors } from "@/server/shoutouts/validation";

const INVALID = "Please check the highlighted fields.";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function failure(error: unknown): FormState {
  if (!(error instanceof DomainError)) throw error;
  return {
    status: "error",
    message: error.message,
    fieldErrors: error.field ? { [error.field]: error.message } : {},
  };
}

/** Runs an admin change, then returns to `path` with a notice code. */
async function andNotify(
  path: string,
  success: string,
  run: () => Promise<unknown>,
): Promise<never> {
  let notice = success;
  try {
    await run();
  } catch (error) {
    if (!(error instanceof DomainError)) throw error;
    notice = error.code === "LAST_ACTIVE" ? "last-active" : "admin-failed";
  }
  revalidatePath("/", "layout");
  redirect(`${path}?notice=${notice}`);
}

export async function resolveReportAction(shoutoutId: string, resolution: "RESTORED" | "REMOVED") {
  const admin = await requireAdmin();
  return andNotify("/admin", resolution === "RESTORED" ? "restored" : "removed", () =>
    resolveCase(getDb(), admin.id, shoutoutId, resolution),
  );
}

export async function saveCardAction(
  cardId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = cardSchema.safeParse({
    title: text(formData, "title"),
    tagline: text(formData, "tagline"),
    illustration: text(formData, "illustration"),
    tone: text(formData, "tone"),
  });
  if (!parsed.success) {
    return { status: "error", message: INVALID, fieldErrors: fieldErrors(parsed.error) };
  }
  try {
    if (cardId) {
      await updateCard(getDb(), admin.id, cardId, parsed.data);
    } else {
      await createCard(getDb(), admin.id, parsed.data);
    }
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  redirect("/admin/cards?notice=card-saved");
}

export async function moveCardAction(id: string, direction: Direction) {
  const admin = await requireAdmin();
  return andNotify("/admin/cards", "card-moved", () => moveCard(getDb(), admin.id, id, direction));
}

export async function setCardActiveAction(id: string, active: boolean) {
  const admin = await requireAdmin();
  return andNotify("/admin/cards", active ? "card-restored" : "card-retired", () =>
    setCardActive(getDb(), admin.id, id, active),
  );
}

export async function createValueAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = valueSchema.safeParse({ name: text(formData, "name") });
  if (!parsed.success) {
    return { status: "error", message: INVALID, fieldErrors: fieldErrors(parsed.error) };
  }
  try {
    await createValue(getDb(), admin.id, parsed.data.name);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  redirect("/admin/values?notice=value-saved");
}

export async function renameValueAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = valueSchema.safeParse({ name: text(formData, "name") });
  if (!parsed.success) {
    return { status: "error", message: INVALID, fieldErrors: fieldErrors(parsed.error) };
  }
  try {
    await renameValue(getDb(), admin.id, id, parsed.data.name);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/", "layout");
  redirect("/admin/values?notice=value-saved");
}

export async function moveValueAction(id: string, direction: Direction) {
  const admin = await requireAdmin();
  return andNotify("/admin/values", "value-moved", () =>
    moveValue(getDb(), admin.id, id, direction),
  );
}

export async function setValueActiveAction(id: string, active: boolean) {
  const admin = await requireAdmin();
  return andNotify("/admin/values", active ? "value-restored" : "value-retired", () =>
    setValueActive(getDb(), admin.id, id, active),
  );
}
