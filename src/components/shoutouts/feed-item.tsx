import Link from "next/link";
import { deleteShoutoutAction } from "@/app/actions/shoutouts";
import { toCardDesign } from "@/components/cards/designs";
import { ShoutoutCard } from "@/components/cards/shoutout-card";
import { buttonClasses } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { FeedItem } from "@/server/shoutouts/feed";
import { DeleteShoutoutButton } from "./delete-button";

export function FeedItemCard({ item, now = new Date() }: { item: FeedItem; now?: Date }) {
  return (
    <ShoutoutCard
      layout="horizontal"
      design={toCardDesign(item.card)}
      from={item.sender.name}
      to={item.recipients.map((r) => r.name)}
      value={item.value.name}
      message={item.message}
      meta={
        <p className="flex items-center gap-2 text-sm text-muted">
          {item.visibility === "PRIVATE" && (
            <span className="rounded-full bg-lilac-soft px-2 py-0.5 text-xs font-bold text-lilac-strong">
              Private
            </span>
          )}
          <time dateTime={item.createdAt.toISOString()} title={item.createdAt.toUTCString()}>
            {formatRelativeTime(item.createdAt, now)}
          </time>
          {item.editedAt && <span>· edited</span>}
        </p>
      }
      actions={
        item.canModify && (
          <div className="flex justify-end gap-1 border-t-2 border-border pt-3">
            <Link
              href={`/shoutouts/${item.id}/edit`}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Edit
            </Link>
            <DeleteShoutoutButton action={deleteShoutoutAction.bind(null, item.id)} />
          </div>
        )
      }
    />
  );
}
