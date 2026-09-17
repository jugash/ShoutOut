import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutEverywhere } from "@/app/actions/auth";
import { isAdmin } from "@/server/auth/roles";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }
  const { user } = session;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <span className="text-2xl font-extrabold">
          Shout<span className="text-teal">Out</span>
        </span>
        <form action={signOutEverywhere}>
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
          >
            Sign out
          </button>
        </form>
      </header>
      <section className="rounded-3xl border border-border bg-surface p-8">
        <h1 className="text-3xl font-extrabold">Hi {user.name?.split(" ")[0] ?? "there"} 👋</h1>
        <p className="mt-2 text-muted">You&apos;re signed in as {user.email}.</p>
        {isAdmin(user.roles) && (
          <p className="mt-4 inline-block rounded-full bg-teal/15 px-3 py-1 text-sm font-bold text-teal-strong">
            Admin
          </p>
        )}
      </section>
    </main>
  );
}
