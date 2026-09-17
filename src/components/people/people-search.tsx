"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button";

/**
 * Search box that updates results as you type (debounced), keeping the query in
 * the URL. Still works as a plain form without JavaScript.
 */
export function PeopleSearch({
  initialQuery,
  debounceMs = 250,
}: {
  initialQuery: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const lastPushed = useRef(initialQuery);

  useEffect(() => {
    if (query.trim() === lastPushed.current.trim()) return;
    const timer = setTimeout(() => search(query), debounceMs);
    return () => clearTimeout(timer);
  });

  function search(value: string) {
    const trimmed = value.trim();
    lastPushed.current = value;
    startTransition(() => {
      router.replace(trimmed ? `${pathname}?q=${encodeURIComponent(trimmed)}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <form
      method="get"
      role="search"
      className="flex gap-2"
      onSubmit={(event) => {
        // Enter searches straight away instead of waiting for the debounce.
        event.preventDefault();
        search(query);
      }}
    >
      <label htmlFor="people-q" className="sr-only">
        Search people
      </label>
      <input
        id="people-q"
        name="q"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name or email"
        aria-busy={pending}
        className="flex-1 rounded-full border-2 border-border bg-surface px-5 py-2.5 text-lg focus:border-teal focus:outline-none"
      />
      <noscript>
        <button type="submit" className={buttonClasses({ variant: "secondary" })}>
          Search
        </button>
      </noscript>
    </form>
  );
}
