import type { DbClient } from "@/lib/db";

export type Direction = "up" | "down";

/**
 * Moves one item up or down and rewrites sort orders as 1..n, so gaps or
 * duplicates left by earlier edits are cleaned up too. Returns false at the ends.
 */
export async function moveInOrder(
  items: { id: string }[],
  id: string,
  direction: Direction,
  save: (id: string, sortOrder: number) => Promise<unknown>,
): Promise<boolean> {
  const index = items.findIndex((item) => item.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= items.length) return false;
  const reordered = [...items];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await Promise.all(reordered.map((item, i) => save(item.id, i + 1)));
  return true;
}

export type { DbClient };
