"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/shoutouts";
import { buttonClasses } from "@/components/ui/button";
import { FieldError } from "./pickers";

export function ReportForm({
  action,
  reasons,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  reasons: { value: string; label: string }[];
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors : {};
  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-coral-soft px-4 py-3 font-bold text-coral-strong">
          {state.message}
        </p>
      )}
      <fieldset>
        <legend className="font-bold">What&apos;s wrong with it?</legend>
        <div className="mt-2 space-y-2">
          {reasons.map((reason) => (
            <label
              key={reason.value}
              className="flex items-center gap-3 rounded-xl border-2 border-border bg-surface px-4 py-3"
            >
              <input
                type="radio"
                name="reason"
                value={reason.value}
                className="size-4 accent-teal"
              />
              {reason.label}
            </label>
          ))}
        </div>
        <FieldError id="reason-error" message={errors.reason} />
      </fieldset>
      <div>
        <label htmlFor="report-note" className="font-bold">
          Anything else admins should know?{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="report-note"
          name="note"
          rows={3}
          maxLength={500}
          className="mt-2 w-full rounded-2xl border-2 border-border bg-surface p-3 focus:border-teal focus:outline-none"
        />
        <FieldError id="note-error" message={errors.note} />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className={buttonClasses({ className: "bg-coral text-white hover:bg-coral-strong" })}
        >
          {pending ? "Reporting…" : "Report shoutout"}
        </button>
        <Link href={cancelHref} className={buttonClasses({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
