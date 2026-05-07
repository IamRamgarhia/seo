"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { runCapture, type CaptureState } from "./actions";

export function CaptureForm() {
  const [state, formAction, pending] = useActionState<
    CaptureState | null,
    FormData
  >(runCapture, null);

  return (
    <form
      action={formAction}
      className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_140px_140px]">
        <input
          name="query"
          required
          placeholder="vegan meal prep services"
          className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <input
          name="ourDomain"
          placeholder="yoursite.com"
          className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <input
          name="country"
          defaultValue="US"
          maxLength={4}
          className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm uppercase focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-md bg-rose-500/15 px-5 text-sm font-medium text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-rose-500/25 disabled:opacity-50"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Scanning SERP…
          </>
        ) : (
          <>
            <Sparkles className="mr-2 size-4" />
            Capture snapshot
          </>
        )}
      </button>

      {state && !state.ok && (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
          {state.error}
        </p>
      )}
    </form>
  );
}
