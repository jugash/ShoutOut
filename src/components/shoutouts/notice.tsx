const NOTICES: Record<string, { text: string; tone: "good" | "bad" }> = {
  sent: { text: "Shoutout sent! 🎉", tone: "good" },
  updated: { text: "Shoutout updated.", tone: "good" },
  deleted: { text: "Shoutout deleted and your budget refunded.", tone: "good" },
  "delete-failed": { text: "That shoutout can no longer be deleted.", tone: "bad" },
  reported: {
    text: "Thanks for letting us know. The shoutout is hidden while an admin reviews it.",
    tone: "good",
  },
  restored: { text: "Shoutout restored and visible again.", tone: "good" },
  removed: { text: "Shoutout removed.", tone: "good" },
  "card-saved": { text: "Card saved.", tone: "good" },
  "card-moved": { text: "Card order updated.", tone: "good" },
  "card-retired": {
    text: "Card retired. It can no longer be picked, but existing shoutouts keep it.",
    tone: "good",
  },
  "card-restored": { text: "Card available again.", tone: "good" },
  "value-saved": { text: "Value saved.", tone: "good" },
  "value-moved": { text: "Value order updated.", tone: "good" },
  "value-retired": { text: "Value retired. Existing shoutouts keep it.", tone: "good" },
  "value-restored": { text: "Value available again.", tone: "good" },
  "last-active": { text: "At least one must stay available.", tone: "bad" },
  "admin-failed": {
    text: "That change couldn't be made. It may already have been done.",
    tone: "bad",
  },
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
