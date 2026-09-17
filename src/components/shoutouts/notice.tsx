const NOTICES: Record<string, { text: string; tone: "good" | "bad" }> = {
  sent: { text: "Shoutout sent! 🎉", tone: "good" },
  updated: { text: "Shoutout updated.", tone: "good" },
  deleted: { text: "Shoutout deleted and your budget refunded.", tone: "good" },
  "delete-failed": { text: "That shoutout can no longer be deleted.", tone: "bad" },
};

export function Notice({ code }: { code?: string }) {
  const notice = code ? NOTICES[code] : undefined;
  if (!notice) return null;
  return (
    <p
      role="status"
      className={
        notice.tone === "good"
          ? "rounded-2xl bg-leaf-soft px-4 py-3 font-bold text-leaf-strong"
          : "rounded-2xl bg-coral-soft px-4 py-3 font-bold text-coral-strong"
      }
    >
      {notice.text}
    </p>
  );
}
