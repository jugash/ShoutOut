/** The reactions people can add to a shoutout, in display order. */
export const REACTIONS = [
  { key: "clap", emoji: "👏", label: "Applause" },
  { key: "heart", emoji: "❤️", label: "Love" },
  { key: "party", emoji: "🎉", label: "Celebrate" },
  { key: "fire", emoji: "🔥", label: "On fire" },
  { key: "raised-hands", emoji: "🙌", label: "Hooray" },
  { key: "rocket", emoji: "🚀", label: "Rocket" },
  { key: "hundred", emoji: "💯", label: "100" },
  { key: "star-struck", emoji: "🤩", label: "Amazing" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["key"];

export function isReactionKey(value: string): value is ReactionKey {
  return REACTIONS.some((reaction) => reaction.key === value);
}

export interface ReactionSummary {
  key: ReactionKey;
  emoji: string;
  label: string;
  count: number;
  reacted: boolean;
  names: string[];
}

/** Groups raw reactions into per-emoji counts in display order, skipping unknown keys. */
export function summarizeReactions(
  rows: { emoji: string; userId: string; user: { name: string } }[],
  viewerId: string,
): ReactionSummary[] {
  return REACTIONS.flatMap((reaction) => {
    const matching = rows.filter((row) => row.emoji === reaction.key);
    if (matching.length === 0) return [];
    return [
      {
        ...reaction,
        count: matching.length,
        reacted: matching.some((row) => row.userId === viewerId),
        names: matching.map((row) => row.user.name),
      },
    ];
  });
}

/** The reaction list after the viewer toggles `key` (used for optimistic updates). */
export function toggleInSummary(
  reactions: ReactionSummary[],
  key: ReactionKey,
  viewerName: string,
): ReactionSummary[] {
  const existing = reactions.find((reaction) => reaction.key === key);
  if (existing?.reacted) {
    return reactions
      .map((reaction) =>
        reaction.key === key
          ? {
              ...reaction,
              count: reaction.count - 1,
              reacted: false,
              names: reaction.names.filter((name) => name !== viewerName),
            }
          : reaction,
      )
      .filter((reaction) => reaction.count > 0);
  }
  const updated = existing
    ? {
        ...existing,
        count: existing.count + 1,
        reacted: true,
        names: [...existing.names, viewerName],
      }
    : { ...REACTIONS.find((r) => r.key === key)!, count: 1, reacted: true, names: [viewerName] };
  const others = reactions.filter((reaction) => reaction.key !== key);
  const order = (k: string) => REACTIONS.findIndex((r) => r.key === k);
  return [...others, updated].sort((a, b) => order(a.key) - order(b.key));
}

export const COMMENT_MAX_LENGTH = 500;
