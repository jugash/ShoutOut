import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import type { FeedItem } from "@/server/shoutouts/feed";
import { FeedItemCard } from "./feed-item";

/** A page of shoutouts with an empty state and a link to the next page. */
export function FeedList({
  items,
  viewerName,
  now,
  nextHref,
  emptyText,
}: {
  items: FeedItem[];
  viewerName: string;
  now: Date;
  nextHref: string | null;
  emptyText: string;
}) {
  return (
    <>
      {items.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border-2 border-dashed border-border p-8 text-center text-muted">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id}>
              <FeedItemCard item={item} viewerName={viewerName} now={now} />
            </li>
          ))}
        </ul>
      )}
      {nextHref && (
        <div className="text-center">
          <Link href={nextHref} className={buttonClasses({ variant: "outline" })}>
            Show older shoutouts
          </Link>
        </div>
      )}
    </>
  );
}
