import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/layout/app-header";
import { BudgetMeter } from "@/components/shoutouts/budget-meter";
import { FeedItemCard } from "@/components/shoutouts/feed-item";
import { Notice } from "@/components/shoutouts/notice";
import { buttonClasses } from "@/components/ui/button";
import { loadConfig } from "@/lib/config";
import { getDb } from "@/lib/db";
import { getBudget } from "@/server/shoutouts/budget";
import { listFeed } from "@/server/shoutouts/feed";

function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }
  const { user } = session;
  const params = await searchParams;
  const cursor = param(params.cursor);
  const db = getDb();
  const now = new Date();
  const [budget, feed] = await Promise.all([
    getBudget(db, user.id, loadConfig().quarterlyBudget, now),
    listFeed(db, user.id, { cursor, now }),
  ]);
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Notice code={param(params.notice)} />
        <section className="rounded-[var(--radius-card)] border-2 border-border bg-surface p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold">Hi {firstName} 👋</h1>
              <p className="mt-1 text-muted">Who made your day better recently?</p>
            </div>
            {budget.remaining > 0 ? (
              <Link href="/shoutouts/new" className={buttonClasses({ size: "lg" })}>
                Send a shoutout
              </Link>
            ) : (
              <p className="font-bold text-muted">
                You&apos;ve used all your shoutouts this quarter
              </p>
            )}
          </div>
          <BudgetMeter
            className="mt-6"
            allowance={budget.allowance}
            remaining={budget.remaining}
            resetsAt={budget.resetsAt}
          />
        </section>

        <section aria-labelledby="feed-heading" className="space-y-4">
          <h2 id="feed-heading" className="font-display text-2xl font-semibold">
            Latest shoutouts
          </h2>
          {feed.items.length === 0 ? (
            <p className="rounded-[var(--radius-card)] border-2 border-dashed border-border p-8 text-center text-muted">
              {cursor ? "No more shoutouts." : "No shoutouts yet. Be the first to say thanks!"}
            </p>
          ) : (
            <ul className="space-y-4">
              {feed.items.map((item) => (
                <li key={item.id}>
                  <FeedItemCard item={item} now={now} />
                </li>
              ))}
            </ul>
          )}
          {feed.nextCursor && (
            <div className="text-center">
              <Link
                href={`/?cursor=${feed.nextCursor}`}
                className={buttonClasses({ variant: "outline" })}
              >
                Show older shoutouts
              </Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
