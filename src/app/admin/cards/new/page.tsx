import type { Metadata } from "next";
import { saveCardAction } from "@/app/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { CardForm } from "@/components/admin/card-form";
import { requireAdmin } from "../../guard";

export const metadata: Metadata = { title: "New card" };

export default async function NewCardPage() {
  const user = await requireAdmin();
  return (
    <AdminShell user={user} section="cards">
      <h2 className="font-display text-2xl font-semibold">New card</h2>
      <CardForm
        action={saveCardAction.bind(null, null)}
        submitLabel="Create card"
        initial={{ title: "", tagline: "", illustration: "heart", tone: "coral" }}
      />
    </AdminShell>
  );
}
