import type { FeedFilters } from "./feed";

export type SearchParams = Record<string, string | string[] | undefined>;

export const FILTER_KEYS = ["person", "value", "card", "from", "to", "q"] as const;

function single(value: string | string[] | undefined): string | undefined {
  const text = typeof value === "string" ? value.trim() : undefined;
  return text ? text : undefined;
}

/** Parses YYYY-MM-DD as midnight UTC; anything else is ignored. */
export function parseDay(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : date;
}

export function parseFeedFilters(params: SearchParams): {
  filters: FeedFilters;
  raw: Partial<Record<(typeof FILTER_KEYS)[number], string>>;
  active: boolean;
} {
  const raw = Object.fromEntries(
    FILTER_KEYS.flatMap((key) => {
      const value = single(params[key]);
      return value ? [[key, value]] : [];
    }),
  ) as Partial<Record<(typeof FILTER_KEYS)[number], string>>;
  const filters: FeedFilters = {
    personId: raw.person,
    valueId: raw.value,
    cardId: raw.card,
    from: parseDay(raw.from),
    to: parseDay(raw.to),
    query: raw.q?.slice(0, 100),
  };
  return { filters, raw, active: Object.keys(raw).length > 0 };
}

/** Query string for a page link that keeps the current filters. */
export function withParams(
  raw: Partial<Record<string, string>>,
  extra: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...raw, ...extra })) {
    if (value) search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
