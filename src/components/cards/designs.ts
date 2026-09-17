import { isIllustrationName, type IllustrationName } from "./illustrations";

export type CardTone = "coral" | "lilac" | "teal" | "sunny" | "sky" | "leaf";

export interface CardDesign {
  slug: string;
  title: string;
  tagline: string;
  illustration: IllustrationName;
  tone: CardTone;
}

/** The default card set. Admins can add more cards built from these illustrations and tones. */
export const DEFAULT_CARD_DESIGNS: readonly CardDesign[] = [
  {
    slug: "thank-you",
    title: "Thank You",
    tagline: "For being awesome",
    illustration: "heart",
    tone: "coral",
  },
  {
    slug: "above-and-beyond",
    title: "Above & Beyond",
    tagline: "Went the extra mile",
    illustration: "rocket",
    tone: "lilac",
  },
  {
    slug: "team-player",
    title: "Team Player",
    tagline: "A true helping hand",
    illustration: "buddies",
    tone: "teal",
  },
  {
    slug: "innovator",
    title: "Great Idea",
    tagline: "Brilliant thinking",
    illustration: "lightbulb",
    tone: "sunny",
  },
  {
    slug: "welcome-aboard",
    title: "Welcome Aboard",
    tagline: "So glad you're here",
    illustration: "sailboat",
    tone: "sky",
  },
  {
    slug: "congrats",
    title: "Congrats",
    tagline: "Time to celebrate",
    illustration: "party-popper",
    tone: "leaf",
  },
  {
    slug: "customer-hero",
    title: "Customer Hero",
    tagline: "Saved the day",
    illustration: "shield",
    tone: "coral",
  },
  {
    slug: "problem-solver",
    title: "Problem Solver",
    tagline: "Cracked it",
    illustration: "puzzle",
    tone: "lilac",
  },
  {
    slug: "mentor",
    title: "Mentor",
    tagline: "Helping others grow",
    illustration: "sprout",
    tone: "teal",
  },
  {
    slug: "crushed-it",
    title: "Crushed It",
    tagline: "Outstanding result",
    illustration: "trophy",
    tone: "sunny",
  },
];

/** Static class names per tone (kept literal so Tailwind can see them). */
export const TONE_CLASSES: Record<CardTone, { soft: string; strong: string; border: string }> = {
  coral: { soft: "bg-coral-soft", strong: "text-coral-strong", border: "border-coral" },
  lilac: { soft: "bg-lilac-soft", strong: "text-lilac-strong", border: "border-lilac" },
  teal: { soft: "bg-teal-soft", strong: "text-teal-strong", border: "border-teal" },
  sunny: { soft: "bg-sunny-soft", strong: "text-on-sunny dark:text-sunny", border: "border-sunny" },
  sky: { soft: "bg-sky-soft", strong: "text-sky-strong", border: "border-sky" },
  leaf: { soft: "bg-leaf-soft", strong: "text-leaf-strong", border: "border-leaf" },
};

export function findCardDesign(slug: string): CardDesign | undefined {
  return DEFAULT_CARD_DESIGNS.find((card) => card.slug === slug);
}

export const CARD_TONES = Object.keys(TONE_CLASSES) as CardTone[];
const TONES = CARD_TONES;

/** Turns a stored card into a design, falling back safely for unknown artwork or tones. */
export function toCardDesign(card: {
  slug: string;
  title: string;
  tagline: string;
  illustration: string;
  tone: string;
}): CardDesign {
  return {
    slug: card.slug,
    title: card.title,
    tagline: card.tagline,
    illustration: isIllustrationName(card.illustration) ? card.illustration : "heart",
    tone: (TONES as string[]).includes(card.tone) ? (card.tone as CardTone) : "coral",
  };
}
