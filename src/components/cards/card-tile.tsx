import { cn } from "@/lib/cn";
import { TONE_CLASSES, type CardDesign } from "./designs";
import { CardIllustration } from "./illustrations";

/** Compact card preview used in pickers and galleries. */
export function CardTile({ design, className }: { design: CardDesign; className?: string }) {
  const tone = TONE_CLASSES[design.tone];
  return (
    <figure
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-card)] border-2 border-border p-4 text-center",
        tone.soft,
        className,
      )}
    >
      <CardIllustration name={design.illustration} className="h-24 w-auto" />
      <figcaption className="mt-2">
        <span className={cn("block font-display text-lg font-semibold", tone.strong)}>
          {design.title}
        </span>
        <span className="block text-xs text-muted">{design.tagline}</span>
      </figcaption>
    </figure>
  );
}
