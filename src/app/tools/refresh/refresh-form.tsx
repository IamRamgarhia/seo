"use client";

import { useActionState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { runRefresh, type RefreshState } from "./actions";
import { AiFeedback } from "@/components/ai-feedback";
import { AiDisclaimer } from "@/components/ai-disclaimer";

export function RefreshForm() {
  const [state, formAction, pending] = useActionState<RefreshState | null, FormData>(
    runRefresh,
    null,
  );

  return (
    <>
      <form
        action={formAction}
        className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Page URL</span>
            <input
              name="url"
              required
              placeholder="https://yoursite.com/blog/post"
              className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Target keyword</span>
            <input
              name="targetKeyword"
              required
              placeholder="vegan meal planning"
              className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Country</span>
            <input
              name="country"
              defaultValue="US"
              maxLength={4}
              className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm uppercase focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-amber-500/15 px-5 text-sm font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/25 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Diffing your page vs the SERP… (1-2 min)
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 size-4" />
              Detect refresh gap
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
          {state.plan.error && (
            <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-300 ring-1 ring-inset ring-amber-500/30">
              {state.plan.error}
            </p>
          )}

          {state.plan.corpusSize > 0 && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Word-count gap"
                  value={
                    state.plan.wordGap > 0
                      ? `+${state.plan.wordGap}`
                      : `${state.plan.wordGap}`
                  }
                  hint={`SERP median: ${state.plan.serpMedianWordCount}`}
                  tone={state.plan.wordGap > 200 ? "rose" : state.plan.wordGap > 0 ? "amber" : "emerald"}
                />
                <Stat
                  label="Missing topics"
                  value={String(state.plan.missingTerms.length)}
                  hint="High-frequency SERP terms"
                  tone={state.plan.missingTerms.length > 10 ? "rose" : "amber"}
                />
                <Stat
                  label="Missing sections"
                  value={String(state.plan.missingSections.length)}
                  hint="Headings used by 2+ top results"
                  tone={state.plan.missingSections.length > 3 ? "rose" : "amber"}
                />
              </div>

              {state.plan.brief && (
                <section className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Refresh plan</h2>
                    <AiFeedback
                      feature="content_idea"
                      aiOutput={state.plan.brief}
                      size="sm"
                    />
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {state.plan.brief}
                  </pre>
                  <AiDisclaimer />
                </section>
              )}

              {state.plan.missingTerms.length > 0 && (
                <section className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-2">
                  <h3 className="text-sm font-semibold">
                    Topics missing from your page
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {state.plan.missingTerms.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-200 ring-1 ring-inset ring-rose-500/30"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {state.plan.missingSections.length > 0 && (
                <section className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-2">
                  <h3 className="text-sm font-semibold">Sections to add</h3>
                  <ul className="space-y-1 text-sm">
                    {state.plan.missingSections.map((s) => (
                      <li key={s} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
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
  tone: "emerald" | "amber" | "rose";
}) {
  const t = {
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  }[tone];
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${t}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
