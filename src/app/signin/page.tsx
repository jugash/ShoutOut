import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signInWithKeycloak } from "@/app/actions/auth";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Shout<span className="text-teal">Out</span>
        </h1>
        <p className="mt-3 text-muted">Recognise the people who make work better.</p>
        <form action={signInWithKeycloak} className="mt-8">
          <button
            type="submit"
            className="w-full rounded-full bg-sunny px-6 py-3 font-bold text-[#2b2a33] transition hover:bg-sunny-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            Sign in with your work account
          </button>
        </form>
      </div>
    </main>
  );
}
