"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/shoutouts";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Single-field form used to add or rename a company value. */
export function ValueNameForm({
  action,
  initialName = "",
  label,
  submitLabel,
}: {
  action: Action;
  initialName?: string;
  label: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const error = state.status === "error" ? (state.fieldErrors.name ?? state.message) : undefined;
  return (
    <form action={formAction} className="flex flex-1 flex-wrap items-start gap-2">
      <div className="min-w-40 flex-1">
        <label className="sr-only" htmlFor={`value-${label}`}>
          {label}
        </label>
        <input
          id={`value-${label}`}
          name="name"
          maxLength={40}
          defaultValue={initialName}
          placeholder="Value name"
          aria-invalid={error ? true : undefined}
          className={cn(
            "w-full rounded-xl border-2 bg-surface px-3 py-1.5 focus:border-teal focus:outline-none",
            error ? "border-coral" : "border-border",
          )}
        />
        {error && (
          <p role="alert" className="mt-1 text-sm font-bold text-coral-strong">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ variant: "outline", size: "sm" })}
      >
        {submitLabel}
      </button>
    </form>
  );
}
