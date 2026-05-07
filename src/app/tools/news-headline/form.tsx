"use client";

import { useActionState } from "react";
import { Loader2, Newspaper } from "lucide-react";
import { runHeadline, type HeadState } from "./actions";

export function HeadlineForm() {
  const [state, formAction, pending] = useActionState<
    HeadState | null,
    FormData
  >(runHeadline, null);

  return (
    <>
      <form
        action={formAction}
        className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3"
      >
        <input
          name="headline"
          required
          placeholder="Senate passes infrastructure bill in 67-32 vote"
          className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <input
          name="topic"
          placeholder="Topic / context (optional)"
          className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-rose-500/15 px-5 text-sm font-medium text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-rose-500/25 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Auditing…
            </>
          ) : (
            <>
              <Newspaper className="mr-2 size-4" />
              Audit
            </>
          )}
        </button>
      </form>

      {state && !state.ok && (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
          {state.error}
        </p>
      )}

      {state?.ok && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat
              label="Score"
              value={`${state.audit.score}/100`}
              tone={state.audit.score >= 75 ? "emerald" : state.audit.score >= 50 ? "amber" : "rose"}
            />
            <Stat label="Chars" value={state.audit.charCount.toString()} hint="ideal 30-110" />
            <Stat label="Words" value={state.audit.wordCount.toString()} />
            <Stat
              label="Top Stories fit"
              value={state.audit.topStoriesFit ? "yes" : "no"}
              tone={state.audit.topStoriesFit ? "emerald" : "rose"}
            />
          </div>

          {state.audit.issues.length > 0 && (
            <section className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-2">
              <h3 className="text-sm font-semibold">Issues</h3>
              <ul className="space-y-1 text-xs">
                {state.audit.issues.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-300 ring-1 ring-inset ring-amber-500/30"
                  >
                    ⚠ {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {state.audit.suggestions.length > 0 && (
            <section className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-2">
              <h3 className="text-sm font-semibold">AI alternates</h3>
              <ul className="space-y-1.5 text-sm">
                {state.audit.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-md bg-white/[0.03] px-3 py-2 ring-1 ring-inset ring-white/5"
                  >
                    {s}{" "}
                    <span className="text-[10px] text-muted-foreground">
                      ({s.length} chars)
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "emerald" | "amber" | "rose";
}) {
  const t = tone ? { emerald: "text-emerald-300", amber: "text-amber-300", rose: "text-rose-300" }[tone] : "";
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${t}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
