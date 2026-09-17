import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LeaderboardBoard } from "@/components/insights/leaderboard-board";
import { SegmentedLinks } from "@/components/insights/segmented-links";
import { AppHeader } from "@/components/layout/app-header";
import { getDb } from "@/lib/db";
import { topRecipients, topSenders, topValues } from "@/server/insights/leaderboard";
import {
  LEADERBOARD_PERIODS,
  PERIOD_LABELS,
  parsePeriod,
  periodRange,
} from "@/server/insights/periods";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }
  const { user } = session;
  const period = parsePeriod((await searchParams).period);
  const range = periodRange(period);
  const db = getDb();
  const [recipients, senders, values] = await Promise.all([
    topRecipients(db, range, 10, user.id),
    topSenders(db, range, 10, user.id),
    topValues(db, range),
  ]);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Leaderboard</h1>
            <p className="text-muted">Celebrating the people who make recognition happen.</p>
          </div>
          <SegmentedLinks
            label="Period"
            current={period}
            options={LEADERBOARD_PERIODS.map((p) => ({
              value: p,
              label: PERIOD_LABELS[p],
              href: `/leaderboard?period=${p}`,
            }))}
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <LeaderboardBoard
            title="Most recognised"
            description="Shoutouts received"
            unit="shoutouts received"
            board={recipients}
            viewerId={user.id}
          />
          <LeaderboardBoard
            title="Top recognisers"
            description="Colleagues recognised"
            unit="colleagues recognised"
            board={senders}
            viewerId={user.id}
          />
          <LeaderboardBoard
            title="Top values"
            description="Shoutouts per company value"
            unit="shoutouts"
            board={values}
            people={false}
          />
        </div>
        <p className="text-xs text-muted">
          Counts include private shoutouts (numbers only). Weeks start on Monday; all times are UTC.
        </p>
      </main>
    </>
  );
}
