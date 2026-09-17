"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import {
  fetchPeopleIncludingSelf,
  RecipientPicker,
  type Person,
  type SearchPeople,
} from "./recipient-picker";

export interface FeedFilterOptions {
  cards: { id: string; title: string }[];
  values: { id: string; name: string }[];
}

const inputClass =
  "w-full rounded-xl border-2 border-border bg-surface px-3 py-2 focus:border-teal focus:outline-none";

export function FeedFilters({
  options,
  initial,
  person,
  active,
  search = fetchPeopleIncludingSelf,
}: {
  options: FeedFilterOptions;
  initial: Partial<Record<"value" | "card" | "from" | "to" | "q", string>>;
  person: Person | null;
  active: boolean;
  search?: SearchPeople;
}) {
  const [selected, setSelected] = useState<Person[]>(person ? [person] : []);

  return (
    <details
      open={active}
      className="group rounded-[var(--radius-card)] border-2 border-border bg-surface"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 font-bold">
        <span>
          🔍 Search &amp; filter
          {active && (
            <span className="ml-2 rounded-full bg-sunny-soft px-2 py-0.5 text-xs dark:text-sunny">
              On
            </span>
          )}
        </span>
        <span aria-hidden className="text-muted transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <form
        method="get"
        action="/"
        className="grid gap-4 border-t-2 border-border p-5 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label htmlFor="filter-q" className="text-sm font-bold">
            Message contains
          </label>
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={initial.q}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <RecipientPicker
            name="person"
            label="Person (sent or received)"
            hint=""
            labelClassName="text-sm font-bold"
            max={1}
            selected={selected}
            onChange={setSelected}
            search={search}
          />
        </div>
        <div>
          <label htmlFor="filter-value" className="text-sm font-bold">
            Value
          </label>
          <select
            id="filter-value"
            name="value"
            defaultValue={initial.value ?? ""}
            className={inputClass}
          >
            <option value="">Any value</option>
            {options.values.map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-card" className="text-sm font-bold">
            Card
          </label>
          <select
            id="filter-card"
            name="card"
            defaultValue={initial.card ?? ""}
            className={inputClass}
          >
            <option value="">Any card</option>
            {options.cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-from" className="text-sm font-bold">
            From
          </label>
          <input
            id="filter-from"
            name="from"
            type="date"
            defaultValue={initial.from}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="filter-to" className="text-sm font-bold">
            To
          </label>
          <input
            id="filter-to"
            name="to"
            type="date"
            defaultValue={initial.to}
            className={inputClass}
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className={buttonClasses({ variant: "secondary" })}>
            Apply filters
          </button>
          {active && (
            <Link href="/" className={buttonClasses({ variant: "ghost" })}>
              Clear
            </Link>
          )}
        </div>
      </form>
    </details>
  );
}
