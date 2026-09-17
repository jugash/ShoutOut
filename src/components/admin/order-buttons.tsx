import { buttonClasses } from "@/components/ui/button";

/** Up/down/retire/restore buttons for an ordered admin list. */
export function OrderButtons({
  name,
  first,
  last,
  active,
  move,
  setActive,
}: {
  name: string;
  first: boolean;
  last: boolean;
  active: boolean;
  move: (direction: "up" | "down") => Promise<void>;
  setActive: (active: boolean) => Promise<void>;
}) {
  const small = buttonClasses({ variant: "ghost", size: "sm" });
  return (
    <div className="flex items-center gap-1">
      <form action={move.bind(null, "up")}>
        <button type="submit" disabled={first} aria-label={`Move ${name} up`} className={small}>
          ↑
        </button>
      </form>
      <form action={move.bind(null, "down")}>
        <button type="submit" disabled={last} aria-label={`Move ${name} down`} className={small}>
          ↓
        </button>
      </form>
      <form action={setActive.bind(null, !active)}>
        <button type="submit" className={small}>
          {active ? "Retire" : "Restore"}
        </button>
      </form>
    </div>
  );
}
