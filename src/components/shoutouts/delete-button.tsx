"use client";

import { buttonClasses } from "@/components/ui/button";

/** Submits the bound delete action after the user confirms. */
export function DeleteShoutoutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Delete this shoutout? The recipients will no longer see it.")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={buttonClasses({ variant: "ghost", size: "sm", className: "text-coral-strong" })}
      >
        Delete
      </button>
    </form>
  );
}
