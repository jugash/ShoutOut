"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/shoutouts";
import { ShoutoutCard } from "@/components/cards/shoutout-card";
import { buttonClasses } from "@/components/ui/button";
import {
  CardPicker,
  MessageField,
  ValuePicker,
  VisibilityPicker,
  type CardOption,
} from "./pickers";
import { RecipientPicker, type Person, type SearchPeople } from "./recipient-picker";

export interface SendFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  cards: CardOption[];
  values: { id: string; name: string }[];
  senderName: string;
  remaining: number;
  maxRecipients: number;
  maxMessageLength: number;
  search?: SearchPeople;
}

export function SendShoutoutForm({
  action,
  cards,
  values,
  senderName,
  remaining,
  maxRecipients,
  maxMessageLength,
  search,
}: SendFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const [recipients, setRecipients] = useState<Person[]>([]);
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [valueId, setValueId] = useState("");
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  const errors = state.status === "error" ? state.fieldErrors : {};
  const card = cards.find((c) => c.id === cardId);
  const value = values.find((v) => v.id === valueId);
  const overBudget = recipients.length > remaining;
  const maxPeople = Math.min(maxRecipients, Math.max(remaining, 1));

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        {state.status === "error" && (
          <p
            role="alert"
            className="rounded-2xl bg-coral-soft px-4 py-3 font-bold text-coral-strong"
          >
            {state.message}
          </p>
        )}
        <RecipientPicker
          selected={recipients}
          onChange={setRecipients}
          max={maxPeople}
          error={errors.recipientIds}
          search={search}
        />
        <CardPicker cards={cards} value={cardId} onChange={setCardId} error={errors.cardId} />
        <ValuePicker values={values} value={valueId} onChange={setValueId} error={errors.valueId} />
        <MessageField
          value={message}
          onChange={setMessage}
          maxLength={maxMessageLength}
          error={errors.message}
        />
        <VisibilityPicker value={visibility} onChange={setVisibility} />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <h2 className="font-display text-xl font-semibold">Preview</h2>
        {card && (
          <ShoutoutCard
            design={card.design}
            from={senderName}
            to={recipients.length ? recipients.map((r) => r.name) : ["…"]}
            value={value?.name}
            message={message.trim() || "Your message will appear here."}
          />
        )}
        <p className="text-sm text-muted" aria-live="polite">
          {recipients.length === 0
            ? `You have ${remaining} shoutouts left this quarter.`
            : `This uses ${recipients.length} of your ${remaining} remaining shoutouts.`}
        </p>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending || overBudget}
            className={buttonClasses({ size: "lg", className: "flex-1" })}
          >
            {pending ? "Sending…" : "Send shoutout"}
          </button>
          <Link href="/" className={buttonClasses({ variant: "ghost", size: "lg" })}>
            Cancel
          </Link>
        </div>
      </aside>
    </form>
  );
}
