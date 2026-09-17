import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveCardAction } from "@/app/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { CardForm } from "@/components/admin/card-form";
import { toCardDesign } from "@/components/cards/designs";
import { getDb } from "@/lib/db";
import { requireAdmin } from "../../guard";

export const metadata: Metadata = { title: "Edit card" };

export default async function EditCardPage({ params }: PageProps<"/admin/cards/[id]">) {
  const user = await requireAdmin();
  const { id } = await params;
  const card = await getDb().card.findUnique({ where: { id } });
  if (!card) {
    notFound();
  }
  const design = toCardDesign(card);
  return (
    <AdminShell user={user} section="cards">
      <h2 className="font-display text-2xl font-semibold">Edit {card.title}</h2>
      <p className="text-sm text-muted">Changes apply to existing shoutouts using this card too.</p>
      <CardForm
        action={saveCardAction.bind(null, card.id)}
        submitLabel="Save card"
        initial={{
          title: card.title,
          tagline: card.tagline,
          illustration: design.illustration,
          tone: design.tone,
        }}
      />
    </AdminShell>
  );
}
