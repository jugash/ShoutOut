/**
 * A tiny tagged template for parameterised SQL. Values become $1, $2, … and
 * nested fragments are spliced in, so queries can be composed safely.
 *
 *   sql`SELECT * FROM users WHERE id = ${id} ${active ? sql`AND active` : empty}`
 */
/**
 * Marks SQL fragments. A registered symbol rather than `instanceof`, because the
 * bundler can load this module more than once (e.g. separate server chunks), and
 * a fragment from one copy must still be recognised by another.
 */
const SQL_FRAGMENT = Symbol.for("shoutout.sql-fragment");

export class Sql {
  readonly [SQL_FRAGMENT] = true;

  constructor(
    readonly strings: readonly string[],
    readonly values: readonly unknown[],
  ) {}
}

export function isSql(value: unknown): value is Sql {
  return typeof value === "object" && value !== null && SQL_FRAGMENT in value;
}

export function sql(strings: TemplateStringsArray | readonly string[], ...values: unknown[]): Sql {
  return new Sql([...strings], values);
}

export const empty = sql``;

/** Joins fragments with a separator, e.g. `join(conditions, " AND ")`. */
export function join(fragments: readonly Sql[], separator: string): Sql {
  if (fragments.length === 0) return empty;
  const strings = ["", ...fragments.slice(1).map(() => separator), ""];
  return new Sql(strings, fragments);
}

export function toQuery(query: Sql): { text: string; values: unknown[] } {
  const values: unknown[] = [];
  const build = (fragment: Sql): string =>
    fragment.strings.reduce((text, part, index) => {
      if (index === 0) return part;
      const value = fragment.values[index - 1];
      const inserted = isSql(value) ? build(value) : `$${values.push(value)}`;
      return text + inserted + part;
    }, "");
  return { text: build(query), values };
}
