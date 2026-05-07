"use client";

import { useActionState } from "react";
import { ExternalLink, History, Loader2 } from "lucide-react";
import { runWayback, type WaybackState } from "./actions";

export function WaybackForm() {
  const [state, formAction, pending] = useActionState<
    WaybackState | null,
    FormData
  >(runWayback, null);

  return (
    <>
      <form
        action={formAction}
        className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_140px]">
          <input
            name="url"
            required
            placeholder="https://example.com/page"
            className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center justify-center rounded-md bg-violet-500/15 px-4 text-xs font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30 hover:bg-violet-500/25 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-3 animate-spin" />
                Fetching…
              </>
            ) : (
              <>
                <History className="mr-2 size-3" />
                Fetch
              </>
            )}
          </button>
        </div>
      </form>

      {state && !state.ok && (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
          {state.error}
        </p>
      )}

      {state?.ok && state.snaps.length === 0 && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-300 ring-1 ring-inset ring-amber-500/30">
          No archived snapshots for this URL.
        </p>
      )}

      {state?.ok && state.snaps.length > 0 && (
        <section className="glass-apple relative overflow-hidden rounded-2xl">
          <header className="border-b border-white/[0.06] px-5 py-3">
            <h3 className="text-sm font-semibold">
              {state.snaps.length} snapshots
            </h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {state.url}
            </p>
          </header>
          <ul className="divide-y divide-white/[0.05]">
            {state.snaps.map((s) => (
              <li
                key={s.ts}
                className="flex items-center justify-between gap-3 px-5 py-1.5 text-xs"
              >
                <span className="tabular-nums">{formatTs(s.ts)}</span>
                <a
                  href={s.archiveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-violet-300 hover:underline"
                >
                  View archive <ExternalLink className="size-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function formatTs(ts: string): string {
  if (!/^\d{14}$/.test(ts)) return ts;
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)}`;
}
