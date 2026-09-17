/** Calendar quarter containing `now`, in UTC. `end` is exclusive and is when budgets reset. */
export function quarterBounds(now: Date): { start: Date; end: Date } {
  const year = now.getUTCFullYear();
  const firstMonth = Math.floor(now.getUTCMonth() / 3) * 3;
  return {
    start: new Date(Date.UTC(year, firstMonth, 1)),
    end: new Date(Date.UTC(year, firstMonth + 3, 1)),
  };
}
