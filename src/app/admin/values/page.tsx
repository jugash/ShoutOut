import type { Metadata } from "next";
import {
  createValueAction,
  moveValueAction,
  renameValueAction,
  setValueActiveAction,
} from "@/app/actions/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrderButtons } from "@/components/admin/order-buttons";
import { ValueNameForm } from "@/components/admin/value-forms";
import { cn } from "@/lib/cn";
import { getDb } from "@/lib/db";
import { listAllValues } from "@/server/admin/catalog";
import { requireAdmin } from "../guard";

export const metadata: Metadata = { title: "Values" };

export default async function AdminValuesPage({ searchParams }: PageProps<"/admin/values">) {
  const user = await requireAdmin();
  const { notice } = await searchParams;
  const values = await listAllValues(getDb());

  return (
    <AdminShell
      user={user}
      section="values"
      notice={typeof notice === "string" ? notice : undefined}
    >
      <p className="text-muted">
        Company values people tag shoutouts with. Renaming updates existing shoutouts; retiring
        hides a value from new shoutouts.
      </p>
      <ul className="space-y-2">
        {values.map((value, index) => (
          <li
            key={value.id}
            className={cn(
              "flex flex-wrap items-center gap-3 rounded-2xl border-2 border-border bg-surface p-3",
              !value.active && "opacity-60",
            )}
          >
            <ValueNameForm
              action={renameValueAction.bind(null, value.id)}
              initialName={value.name}
              label={`Rename ${value.name}`}
              submitLabel="Rename"
            />
            <span className="text-sm text-muted">
              {!value.active && "Retired · "}used {value.uses} {value.uses === 1 ? "time" : "times"}
            </span>
            <OrderButtons
              name={value.name}
              first={index === 0}
              last={index === values.length - 1}
              active={value.active}
              move={moveValueAction.bind(null, value.id)}
              setActive={setValueActiveAction.bind(null, value.id)}
            />
          </li>
        ))}
      </ul>
      <section className="rounded-2xl border-2 border-dashed border-border p-4">
        <h2 className="mb-2 font-bold">Add a value</h2>
        <ValueNameForm action={createValueAction} label="New value name" submitLabel="Add value" />
      </section>
    </AdminShell>
  );
}
