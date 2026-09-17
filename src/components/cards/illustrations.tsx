import type { ReactNode, SVGProps } from "react";

/*
 * Flat, rounded "sticker" illustrations for shoutout cards.
 * Colours come from CSS tokens so they follow light/dark mode.
 */

export const ILLUSTRATION_NAMES = [
  "heart",
  "rocket",
  "buddies",
  "lightbulb",
  "sailboat",
  "party-popper",
  "shield",
  "puzzle",
  "sprout",
  "trophy",
] as const;

export type IllustrationName = (typeof ILLUSTRATION_NAMES)[number];

const line = {
  stroke: "var(--line)",
  strokeWidth: 3,
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const;

function Sparkle({
  x,
  y,
  r,
  fill = "var(--sunny)",
}: {
  x: number;
  y: number;
  r: number;
  fill?: string;
}) {
  const d = `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
  return <path d={d} fill={fill} {...line} strokeWidth={2} />;
}

function Heart() {
  return (
    <>
      <Sparkle x={34} y={32} r={8} />
      <Sparkle x={128} y={28} r={6} fill="var(--teal)" />
      <Sparkle x={130} y={88} r={7} />
      <path
        d="M80 98C80 98 42 78 42 52C42 36 60 30 71 40C75 43 78 47 80 51C82 47 85 43 89 40C100 30 118 36 118 52C118 78 80 98 80 98Z"
        fill="var(--coral)"
        {...line}
      />
      <path
        d="M56 50Q57 43 64 42"
        fill="none"
        stroke="var(--paper)"
        strokeWidth={5}
        strokeLinecap="round"
      />
    </>
  );
}

function Rocket() {
  return (
    <>
      <path
        d="M22 96C22 86 32 82 38 86C40 76 54 74 58 84C66 82 72 88 70 96Z"
        fill="var(--paper)"
        {...line}
      />
      <Sparkle x={36} y={30} r={7} />
      <Sparkle x={130} y={92} r={6} fill="var(--teal)" />
      <circle cx={122} cy={26} r={3} fill="var(--line)" />
      <g transform="rotate(38 84 58)">
        <path d="M72 80Q84 108 96 80Z" fill="var(--sunny)" {...line} />
        <path d="M78 80Q84 96 90 80Z" fill="var(--coral)" />
        <path d="M70 62L56 82H72Z" fill="var(--lilac)" {...line} />
        <path d="M98 62L112 82H96Z" fill="var(--lilac)" {...line} />
        <path d="M84 16C98 30 102 50 99 80H69C66 50 70 30 84 16Z" fill="var(--paper)" {...line} />
        <circle cx={84} cy={48} r={9} fill="var(--sky)" {...line} />
        <path
          d="M76 30Q84 22 92 30"
          fill="none"
          stroke="var(--lilac)"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
    </>
  );
}

function Buddies() {
  return (
    <>
      <path
        d="M80 34C80 34 70 28 70 21C70 16 76 14 80 19C84 14 90 16 90 21C90 28 80 34 80 34Z"
        fill="var(--coral)"
        {...line}
      />
      <Sparkle x={30} y={28} r={6} />
      <Sparkle x={132} y={30} r={6} />
      {/* left buddy */}
      <path d="M30 108V84C30 70 40 62 54 62C68 62 78 70 78 84V108Z" fill="var(--teal)" {...line} />
      <circle cx={54} cy={46} r={15} fill="var(--paper)" {...line} />
      <circle cx={49} cy={45} r={2} fill="var(--line)" />
      <circle cx={59} cy={45} r={2} fill="var(--line)" />
      <path d="M49 51Q54 55 59 51" fill="none" {...line} strokeWidth={2.5} />
      {/* right buddy */}
      <path
        d="M82 108V84C82 70 92 62 106 62C120 62 130 70 130 84V108Z"
        fill="var(--sunny)"
        {...line}
      />
      <circle cx={106} cy={46} r={15} fill="var(--paper)" {...line} />
      <circle cx={101} cy={45} r={2} fill="var(--line)" />
      <circle cx={111} cy={45} r={2} fill="var(--line)" />
      <path d="M101 51Q106 55 111 51" fill="none" {...line} strokeWidth={2.5} />
      {/* linked arms */}
      <path d="M68 86Q80 76 92 86" fill="none" {...line} strokeWidth={9} />
      <path
        d="M68 86Q80 76 92 86"
        fill="none"
        stroke="var(--paper)"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
    </>
  );
}

function Lightbulb() {
  return (
    <>
      {[
        "M80 10V18",
        "M40 26L46 32",
        "M120 26L114 32",
        "M28 60H36",
        "M124 60H132",
        "M42 92L48 86",
        "M118 92L112 86",
      ].map((d) => (
        <path key={d} d={d} {...line} />
      ))}
      <path
        d="M80 28C63 28 52 41 52 56C52 66 57 72 62 78C65 81 66 84 66 88H94C94 84 95 81 98 78C103 72 108 66 108 56C108 41 97 28 80 28Z"
        fill="var(--sunny)"
        {...line}
      />
      <path d="M72 88V66L80 74L88 66V88" fill="none" {...line} strokeWidth={2.5} />
      <path
        d="M64 44Q68 36 76 35"
        fill="none"
        stroke="var(--paper)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <rect x={66} y={88} width={28} height={10} rx={3} fill="var(--teal)" {...line} />
      <rect x={70} y={98} width={20} height={9} rx={4} fill="var(--teal)" {...line} />
    </>
  );
}

function Sailboat() {
  return (
    <>
      <circle cx={34} cy={30} r={12} fill="var(--sunny)" {...line} />
      <path d="M112 28Q118 22 124 28Q130 22 136 28" fill="none" {...line} strokeWidth={2.5} />
      <path d="M82 22V80" {...line} />
      <path d="M86 26V74H120Z" fill="var(--paper)" {...line} />
      <path d="M78 36V74H52Z" fill="var(--coral)" {...line} />
      <path d="M82 22L94 26L82 30" fill="var(--teal)" {...line} strokeWidth={2} />
      <path d="M40 80H124L110 98H54Z" fill="var(--sky)" {...line} />
      <path
        d="M16 104Q26 96 36 104T56 104T76 104T96 104T116 104T136 104T156 104"
        fill="none"
        stroke="var(--sky)"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </>
  );
}

function PartyPopper() {
  return (
    <>
      <path d="M30 102L58 42L90 74Z" fill="var(--sunny)" {...line} />
      <path
        d="M42 76L64 96M50 58L80 86"
        stroke="var(--coral)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path d="M30 102L58 42L90 74Z" fill="none" {...line} />
      <path
        d="M72 44Q84 20 104 28"
        fill="none"
        stroke="var(--teal)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M84 60Q110 50 118 70"
        fill="none"
        stroke="var(--lilac)"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx={116} cy={24} r={5} fill="var(--coral)" {...line} strokeWidth={2} />
      <circle cx={132} cy={52} r={4} fill="var(--sky)" {...line} strokeWidth={2} />
      <rect
        x={94}
        y={8}
        width={9}
        height={9}
        rx={2}
        fill="var(--leaf)"
        transform="rotate(20 98 12)"
        {...line}
        strokeWidth={2}
      />
      <rect
        x={126}
        y={82}
        width={9}
        height={9}
        rx={2}
        fill="var(--sunny)"
        transform="rotate(-15 130 86)"
        {...line}
        strokeWidth={2}
      />
      <Sparkle x={70} y={20} r={6} fill="var(--lilac)" />
      <Sparkle x={138} y={30} r={5} />
    </>
  );
}

function Shield() {
  return (
    <>
      <path d="M52 44L24 60L40 74L30 96L60 82Z" fill="var(--lilac)" {...line} />
      <path d="M108 44L136 60L120 74L130 96L100 82Z" fill="var(--lilac)" {...line} />
      <path
        d="M80 16L114 28V56C114 78 100 92 80 104C60 92 46 78 46 56V28Z"
        fill="var(--coral)"
        {...line}
      />
      <path d="M80 26L104 35V56C104 72 94 83 80 92C66 83 56 72 56 56V35Z" fill="var(--paper)" />
      <path
        d="M80 76C80 76 64 67 64 56C64 49 72 46 77 51L80 54L83 51C88 46 96 49 96 56C96 67 80 76 80 76Z"
        fill="var(--coral)"
        {...line}
        strokeWidth={2.5}
      />
      <Sparkle x={30} y={26} r={7} />
      <Sparkle x={132} y={24} r={6} />
    </>
  );
}

function Puzzle() {
  return (
    <>
      <path
        d="M24 40H50C46 30 52 24 60 24C68 24 74 30 70 40H78V64C88 60 94 66 94 74C94 82 88 88 78 84V100H24Z"
        fill="var(--lilac)"
        {...line}
      />
      <path
        d="M92 34H136V100H100V84C90 88 84 82 84 74C84 66 90 60 100 64V50H92Z"
        fill="var(--sunny)"
        {...line}
        transform="translate(10 -8)"
      />
      <path
        d="M36 56Q40 50 46 50"
        fill="none"
        stroke="var(--paper)"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Sparkle x={112} y={108} r={6} fill="var(--teal)" />
      <Sparkle x={140} y={14} r={6} />
    </>
  );
}

function Sprout() {
  return (
    <>
      <circle cx={126} cy={30} r={11} fill="var(--sunny)" {...line} />
      <Sparkle x={34} y={30} r={7} fill="var(--teal)" />
      <path d="M80 80V46" {...line} strokeWidth={4} />
      <path d="M80 58C80 40 64 30 46 32C46 50 60 60 80 58Z" fill="var(--leaf)" {...line} />
      <path d="M80 50C80 30 96 20 116 22C116 42 100 52 80 50Z" fill="var(--leaf)" {...line} />
      <path
        d="M58 40Q66 44 72 52M104 30Q96 36 90 44"
        fill="none"
        stroke="var(--paper)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path d="M52 78H108L102 108H58Z" fill="var(--coral)" {...line} />
      <rect x={48} y={72} width={64} height={12} rx={4} fill="var(--coral)" {...line} />
    </>
  );
}

function Trophy() {
  return (
    <>
      <path d="M52 34H38C38 54 46 62 58 62" fill="none" {...line} strokeWidth={5} />
      <path d="M108 34H122C122 54 114 62 102 62" fill="none" {...line} strokeWidth={5} />
      <path d="M52 22H108V48C108 66 96 76 80 76C64 76 52 66 52 48Z" fill="var(--sunny)" {...line} />
      <path d="M72 76H88V88H72Z" fill="var(--sunny)" {...line} />
      <rect x={58} y={88} width={44} height={16} rx={4} fill="var(--teal)" {...line} />
      <path
        d="M80 32L84.5 41L94 42.5L87 49L88.8 58.5L80 54L71.2 58.5L73 49L66 42.5L75.5 41Z"
        fill="var(--paper)"
        {...line}
        strokeWidth={2.5}
      />
      <Sparkle x={30} y={22} r={7} fill="var(--coral)" />
      <Sparkle x={134} y={82} r={7} fill="var(--lilac)" />
      <Sparkle x={130} y={16} r={5} />
    </>
  );
}

const ILLUSTRATIONS: Record<IllustrationName, () => ReactNode> = {
  heart: Heart,
  rocket: Rocket,
  buddies: Buddies,
  lightbulb: Lightbulb,
  sailboat: Sailboat,
  "party-popper": PartyPopper,
  shield: Shield,
  puzzle: Puzzle,
  sprout: Sprout,
  trophy: Trophy,
};

export function isIllustrationName(value: string): value is IllustrationName {
  return (ILLUSTRATION_NAMES as readonly string[]).includes(value);
}

export function CardIllustration({
  name,
  title,
  ...props
}: { name: IllustrationName; title?: string } & SVGProps<SVGSVGElement>) {
  const Illustration = ILLUSTRATIONS[name];
  return (
    <svg
      viewBox="0 0 160 120"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      data-illustration={name}
      {...props}
    >
      <Illustration />
    </svg>
  );
}
