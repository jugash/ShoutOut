import type { ReactNode } from "react";
import { SegmentedLinks } from "@/components/insights/segmented-links";
import { AppHeader, type HeaderUser } from "@/components/layout/app-header";
import { Notice } from "@/components/shoutouts/notice";

export type AdminSection = "moderation" | "cards" | "values" | "export" | "audit";

const SECTIONS: { value: AdminSection; label: string; href: string }[] = [
  { value: "moderation", label: "Moderation", href: "/admin" },
  { value: "cards", label: "Cards", href: "/admin/cards" },
  { value: "values", label: "Values", href: "/admin/values" },
  { value: "export", label: "Export", href: "/admin/export" },
  { value: "audit", label: "Audit log", href: "/admin/audit" },
];

export function AdminShell({
  user,
  section,
  pendingCount,
  notice,
  children,
}: {
  user: HeaderUser;
  section: AdminSection;
  pendingCount?: number;
  notice?: string;
  children: ReactNode;
}) {
  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-semibold">Admin</h1>
          <SegmentedLinks
            label="Admin sections"
            current={section}
            options={SECTIONS.map((s) => ({
              ...s,
              label:
                s.value === "moderation" && pendingCount ? `${s.label} (${pendingCount})` : s.label,
            }))}
          />
        </div>
        <Notice code={notice} />
        {children}
      </main>
    </>
  );
}
