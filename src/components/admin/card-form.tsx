"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/shoutouts";
import { CardTile } from "@/components/cards/card-tile";
import { CARD_TONES, TONE_CLASSES, type CardTone } from "@/components/cards/designs";
import {
  CardIllustration,
  ILLUSTRATION_NAMES,
  type IllustrationName,
} from "@/components/cards/illustrations";
import { FieldError } from "@/components/shoutouts/pickers";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface CardFormValues {
  title: string;
  tagline: string;
  illustration: IllustrationName;
  tone: CardTone;
}

/** Literal class names so Tailwind generates them. */
const SWATCHES: Record<CardTone, string> = {
  coral: "bg-coral",
  lilac: "bg-lilac",
  teal: "bg-teal",
  sunny: "bg-sunny",
  sky: "bg-sky",
  leaf: "bg-leaf",
};

const inputClass =
  "mt-2 w-full rounded-xl border-2 bg-surface px-3 py-2 text-lg focus:border-teal focus:outline-none";

export function CardForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: CardFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const [values, setValues] = useState(initial);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const set = <K extends keyof CardFormValues>(key: K, value: CardFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <form action={formAction} className="grid gap-8 md:grid-cols-[1fr_16rem]">
      <div className="space-y-6">
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-2xl bg-coral-soft px-4 py-3 font-bold text-coral-strong"
          >
            {state.message}
          </p>
        )}
        <div>
          <label htmlFor="card-title" className="font-bold">
            Title
          </label>
          <input
            id="card-title"
            name="title"
            maxLength={40}
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            aria-invalid={errors.title ? true : undefined}
            className={cn(inputClass, errors.title ? "border-coral" : "border-border")}
          />
          <FieldError id="title-error" message={errors.title} />
        </div>
        <div>
          <label htmlFor="card-tagline" className="font-bold">
            Tagline
          </label>
          <input
            id="card-tagline"
            name="tagline"
            maxLength={60}
            value={values.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            aria-invalid={errors.tagline ? true : undefined}
            className={cn(inputClass, errors.tagline ? "border-coral" : "border-border")}
          />
          <FieldError id="tagline-error" message={errors.tagline} />
        </div>
        <fieldset>
          <legend className="font-bold">Illustration</legend>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {ILLUSTRATION_NAMES.map((name) => (
              <label
                key={name}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-xl border-2 bg-surface p-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring",
                  values.illustration === name
                    ? "border-foreground"
                    : "border-border hover:bg-surface-muted",
                )}
              >
                <input
                  type="radio"
                  name="illustration"
                  value={name}
                  checked={values.illustration === name}
                  onChange={() => set("illustration", name)}
                  className="sr-only"
                  aria-label={name.replace("-", " ")}
                />
                <CardIllustration name={name} className="h-12 w-auto" />
              </label>
            ))}
          </div>
          <FieldError id="illustration-error" message={errors.illustration} />
        </fieldset>
        <fieldset>
          <legend className="font-bold">Colour</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CARD_TONES.map((tone) => (
              <label
                key={tone}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border-2 px-3 py-1.5 font-bold capitalize has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring",
                  TONE_CLASSES[tone].soft,
                  values.tone === tone ? "border-foreground" : "border-transparent",
                )}
              >
                <input
                  type="radio"
                  name="tone"
                  value={tone}
                  checked={values.tone === tone}
                  onChange={() => set("tone", tone)}
                  className="sr-only"
                />
                <span aria-hidden className={cn("size-4 rounded-full", SWATCHES[tone])} />
                {tone}
              </label>
            ))}
          </div>
          <FieldError id="tone-error" message={errors.tone} />
        </fieldset>
        <div className="flex gap-3">
          <button type="submit" disabled={pending} className={buttonClasses()}>
            {pending ? "Saving…" : submitLabel}
          </button>
          <Link href="/admin/cards" className={buttonClasses({ variant: "ghost" })}>
            Cancel
          </Link>
        </div>
      </div>
      <aside className="space-y-2">
        <h2 className="font-bold">Preview</h2>
        <CardTile
          design={{
            slug: "preview",
            title: values.title || "Card title",
            tagline: values.tagline || "Short tagline",
            illustration: values.illustration,
            tone: values.tone,
          }}
        />
      </aside>
    </form>
  );
}
