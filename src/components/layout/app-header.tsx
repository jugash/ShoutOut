import Link from "next/link";
import { signOutEverywhere } from "@/app/actions/auth";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { buttonClasses } from "@/components/ui/button";
import { isAdmin } from "@/server/auth/roles";
import { getThemePreference } from "@/lib/theme-server";

export interface HeaderUser {
  name?: string | null;
  email?: string | null;
  roles: string[];
}

export async function AppHeader({ user }: { user: HeaderUser }) {
  const theme = await getThemePreference();
  return (
    <header className="sticky top-0 z-10 border-b-2 border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="ShoutOut home">
          <Logo className="h-8 sm:h-9" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle initial={theme} />
          <div className="hidden items-center gap-2 sm:flex">
            <Avatar name={user.name} size="sm" />
            <div className="leading-tight">
              <p className="text-sm font-bold">{user.name ?? user.email}</p>
              {isAdmin(user.roles) && <p className="text-xs font-bold text-teal-strong">Admin</p>}
            </div>
          </div>
          <form action={signOutEverywhere}>
            <button type="submit" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
