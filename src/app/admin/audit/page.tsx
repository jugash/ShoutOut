import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { buttonClasses } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { listAudit } from "@/server/admin/audit";
import { requireAdmin } from "../guard";

export const metadata: Metadata = { title: "Audit log" };

const LABELS: Record<string, string> = {
  "shoutout.reported": "reported a shoutout",
  "shoutout.restored": "restored a shoutout",
  "shoutout.removed": "removed a shoutout",
  "card.created": "created a card",
  "card.updated": "edited a card",
  "card.moved": "reordered a card",
  "card.retired": "retired a card",
  "card.restored": "restored a card",
  "value.created": "added a value",
  "value.renamed": "renamed a value",
  "value.moved": "reordered a value",
  "value.retired": "retired a value",
  "value.restored": "restored a value",
  "export.downloaded": "downloaded an export",
};

function describe(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  return Object.entries(details as Record<string, unknown>)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const user = await requireAdmin();
  const { cursor } = await searchParams;
  const { entries, nextCursor } = await listAudit(getDb(), {
    cursor: typeof cursor === "string" ? cursor : undefined,
  });

  return (
    <AdminShell user={user} section="audit">
      {entries.length === 0 ? (
        <p className="text-muted">No admin or moderation activity yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-muted">
              <tr>
                <th className="px-4 py-2 font-bold">When (UTC)</th>
                <th className="px-4 py-2 font-bold">Who</th>
                <th className="px-4 py-2 font-bold">What</th>
                <th className="px-4 py-2 font-bold">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-border align-top">
                  <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                    {entry.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-4 py-2 font-bold">{entry.actor.name}</td>
                  <td className="px-4 py-2">{LABELS[entry.action] ?? entry.action}</td>
                  <td className="px-4 py-2 break-words text-muted">{describe(entry.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {nextCursor && (
        <Link
          href={`/admin/audit?cursor=${nextCursor}`}
          className={buttonClasses({ variant: "outline" })}
        >
          Older entries
        </Link>
      )}
    </AdminShell>
  );
}
