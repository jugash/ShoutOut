import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DEFAULT_CARD_DESIGNS } from "@/components/cards/designs";
import { CardTile } from "@/components/cards/card-tile";
import { AppHeader } from "@/components/layout/app-header";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }
  const { user } = session;
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        <section className="rounded-[var(--radius-card)] border-2 border-border bg-surface p-6 shadow-card sm:p-10">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Hi {firstName} 👋</h1>
          <p className="mt-2 text-lg text-muted">Who made your day better recently?</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-sunny-soft px-4 py-2 text-sm font-bold dark:text-sunny">
            Sending shoutouts is coming soon
          </p>
        </section>
        <section aria-labelledby="cards-heading">
          <h2 id="cards-heading" className="font-display text-2xl font-semibold">
            Pick a card, say thanks
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {DEFAULT_CARD_DESIGNS.map((design) => (
              <li key={design.slug}>
                <CardTile design={design} className="h-full" />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
