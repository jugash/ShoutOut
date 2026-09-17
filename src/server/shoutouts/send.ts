import type { AppConfig } from "@/lib/config";
import type { Db } from "@/lib/db";
import { DomainError } from "../errors";
import { getBudget } from "./budget";
import type { SendShoutoutInput } from "./validation";

export async function sendShoutout(
  db: Db,
  senderId: string,
  input: SendShoutoutInput,
  config: Pick<AppConfig, "quarterlyBudget">,
  now = new Date(),
) {
  const recipientIds = [...new Set(input.recipientIds)];
  if (recipientIds.includes(senderId)) {
    throw new DomainError(
      "SELF_RECIPIENT",
      "You can't send a shoutout to yourself",
      "recipientIds",
    );
  }

  return db.$transaction(async (tx) => {
    // Serialise sends per sender so concurrent requests can't overspend the budget.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${senderId}))`;

    const [card, value, recipients] = await Promise.all([
      tx.card.findFirst({ where: { id: input.cardId, active: true }, select: { id: true } }),
      tx.companyValue.findFirst({
        where: { id: input.valueId, active: true },
        select: { id: true },
      }),
      tx.user.findMany({
        where: { id: { in: recipientIds }, active: true },
        select: { id: true },
      }),
    ]);
    if (!card) throw new DomainError("CARD_NOT_FOUND", "That card isn't available", "cardId");
    if (!value) {
      throw new DomainError("VALUE_NOT_FOUND", "That value isn't available", "valueId");
    }
    if (recipients.length !== recipientIds.length) {
      throw new DomainError(
        "RECIPIENT_NOT_FOUND",
        "Some of the people you picked can't receive shoutouts",
        "recipientIds",
      );
    }

    const budget = await getBudget(tx, senderId, config.quarterlyBudget, now);
    if (recipientIds.length > budget.remaining) {
      throw new DomainError(
        "BUDGET_EXCEEDED",
        budget.remaining === 0
          ? "You've used all your shoutouts this quarter"
          : `You only have ${budget.remaining} shoutout${budget.remaining === 1 ? "" : "s"} left this quarter`,
        "recipientIds",
      );
    }

    return tx.shoutout.create({
      data: {
        senderId,
        cardId: input.cardId,
        valueId: input.valueId,
        message: input.message,
        visibility: input.visibility,
        createdAt: now,
        recipients: { create: recipientIds.map((userId) => ({ userId })) },
      },
    });
  });
}
