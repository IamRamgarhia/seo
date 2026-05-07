"use client";

import { useActionState } from "react";
import { GitMerge, Loader2 } from "lucide-react";
import { runParity, type ParityState } from "./actions";

const TONE: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  redirected_to_unrelated: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  "404": "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  "5xx": "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  error: "bg-white/5 text-muted-foreground ring-white/10",
};

export function ParityForm() {
  const [state, formAction, pending] = useActionState<
    ParityState | null,
    FormData
  >(runParity, null);

  return (
    <>
      <form
        action={formAction}
        className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3"
      >
        <input
          name="newDomain"
          placeholder="new domain (optional, e.g. newsite.com — used to flag redirects that drift off-host)"
          className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Old URLs (1 per line, max 500)</span>
          <textarea
            name="oldUrls"
            required
            rows={10}
            spellCheck={false}
            placeholder={"https://oldsite.com/page-1\nhttps://oldsite.com/page-2"}
            className="w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 font-mono text-xs focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-amber-500/15 px-5 text-sm font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/25 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Auditing…
            </>
          ) : (
            <>
              <GitMerge className="mr-2 size-4" />
              Audit parity
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
          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-5">
            {Object.entries(state.report.byOutcome).map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-white/5 bg-black/20 px-4 py-3"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {k}
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {v}
                </div>
              </div>
            ))}
          </div>

          <section className="glass-apple relative overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Old URL</th>
                    <th className="px-4 py-2 text-left">Outcome</th>
                    <th className="px-4 py-2 text-right">Status</th>
                    <th className="px-4 py-2 text-right">Hops</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {state.report.rows.map((r) => (
                    <tr key={r.oldUrl} className="border-t border-white/[0.04]">
                      <td className="px-4 py-1.5 font-mono">{r.oldUrl}</td>
                      <td className="px-4 py-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider ring-1 ring-inset ${TONE[r.outcome]}`}
                        >
                          {r.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-right tabular-nums">
                        {r.newStatus ?? "—"}
                      </td>
                      <td className="px-4 py-1.5 text-right tabular-nums text-muted-foreground">
                        {r.redirectChain}
                      </td>
                      <td className="px-4 py-1.5 text-muted-foreground">
                        {r.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
