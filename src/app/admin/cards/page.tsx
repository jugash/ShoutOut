import type { Metadata } from "next";
import Link from "next/link";
import { moveCardAction, setCardActiveAction } from "@/app/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrderButtons } from "@/components/admin/order-buttons";
import { toCardDesign } from "@/components/cards/designs";
import { CardIllustration } from "@/components/cards/illustrations";
import { TONE_CLASSES } from "@/components/cards/designs";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { getDb } from "@/lib/db";
import { listAllCards } from "@/server/admin/catalog";
import { requireAdmin } from "../guard";

export const metadata: Metadata = { title: "Cards" };

export default async function AdminCardsPage({ searchParams }: PageProps<"/admin/cards">) {
  const user = await requireAdmin();
  const { notice } = await searchParams;
  const cards = await listAllCards(getDb());

  return (
    <AdminShell
      user={user}
      section="cards"
      notice={typeof notice === "string" ? notice : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">Cards appear in this order when people send a shoutout.</p>
        <Link href="/admin/cards/new" className={buttonClasses()}>
          New card
        </Link>
      </div>
      <ul className="space-y-2">
        {cards.map((card, index) => {
          const design = toCardDesign(card);
          return (
            <li
              key={card.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-2xl border-2 border-border bg-surface p-3",
                !card.active && "opacity-60",
              )}
            >
              <span className={cn("rounded-xl p-1", TONE_CLASSES[design.tone].soft)}>
                <CardIllustration name={design.illustration} className="h-10 w-auto" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">
                  {card.title}
                  {!card.active && (
                    <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted">
                      Retired
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted">
                  {card.tagline} · used {card.uses} {card.uses === 1 ? "time" : "times"}
                </span>
              </span>
              <Link
                href={`/admin/cards/${card.id}`}
                className={buttonClasses({ variant: "ghost", size: "sm" })}
              >
                Edit
              </Link>
              <OrderButtons
                name={card.title}
                first={index === 0}
                last={index === cards.length - 1}
                active={card.active}
                move={moveCardAction.bind(null, card.id)}
                setActive={setCardActiveAction.bind(null, card.id)}
              />
            </li>
          );
        })}
      </ul>
    </AdminShell>
  );
}
