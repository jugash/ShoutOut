"use client";

import { startTransition, useOptimistic, useState } from "react";
import { cn } from "@/lib/cn";
import {
  REACTIONS,
  toggleInSummary,
  type ReactionKey,
  type ReactionSummary,
} from "@/lib/reactions";

function describe(reaction: ReactionSummary): string {
  const who =
    reaction.names.length <= 3
      ? reaction.names.join(", ")
      : `${reaction.names.slice(0, 3).join(", ")} and ${reaction.names.length - 3} more`;
  return `${reaction.label}: ${who}`;
}

export function ReactionBar({
  reactions,
  viewerName,
  toggle,
}: {
  reactions: ReactionSummary[];
  viewerName: string;
  toggle: (key: ReactionKey) => Promise<void>;
}) {
  const [optimistic, applyOptimistic] = useOptimistic(
    reactions,
    (current: ReactionSummary[], key: ReactionKey) => toggleInSummary(current, key, viewerName),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [popped, setPopped] = useState<ReactionKey | null>(null);

  function react(key: ReactionKey) {
    setPickerOpen(false);
    setPopped(key);
    startTransition(async () => {
      applyOptimistic(key);
      await toggle(key);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {optimistic.map((reaction) => (
        <button
          key={reaction.key}
          type="button"
          aria-pressed={reaction.reacted}
          aria-label={`${reaction.label}, ${reaction.count}`}
          title={describe(reaction)}
          onClick={() => react(reaction.key)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 font-bold transition hover:-translate-y-0.5",
            reaction.reacted
              ? "border-sunny-strong bg-sunny-soft text-foreground"
              : "border-border bg-surface text-muted hover:border-sunny",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "text-xl leading-none",
              popped === reaction.key && "animate-reaction-pop",
            )}
            onAnimationEnd={() => setPopped(null)}
          >
            {reaction.emoji}
          </span>
          <span className="text-sm">{reaction.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          type="button"
          aria-expanded={pickerOpen}
          aria-label="Add a reaction"
          onClick={() => setPickerOpen((open) => !open)}
          className="inline-flex h-9 items-center gap-1 rounded-full border-2 border-dashed border-border px-3 text-sm font-bold text-muted transition hover:border-sunny hover:text-foreground"
        >
          <span aria-hidden className="text-lg leading-none">
            ☺
          </span>
          +
        </button>
        {pickerOpen && (
          <div
            role="menu"
            aria-label="Reactions"
            onKeyDown={(event) => {
              if (event.key === "Escape") setPickerOpen(false);
            }}
            className="absolute bottom-full left-0 z-20 mb-2 grid w-max grid-cols-4 gap-1 rounded-2xl border-2 border-border bg-surface p-2 shadow-card"
          >
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.key}
                type="button"
                role="menuitem"
                aria-label={reaction.label}
                title={reaction.label}
                onClick={() => react(reaction.key)}
                className="group flex size-11 items-center justify-center rounded-xl text-2xl hover:bg-surface-muted"
              >
                <span aria-hidden className="transition group-hover:scale-125">
                  {reaction.emoji}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
