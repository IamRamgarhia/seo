import { CheckCircle2, XCircle } from "lucide-react";

export function LatestSnapshots({
  latest,
}: {
  latest: {
    query: string;
    country: string;
    hasAio: boolean;
    aioIncludesUs: boolean;
    hasFeaturedSnippet: boolean;
    featuredOwnedByUs: boolean;
    ourPosition: number | null;
    paaQuestions: string[];
    capturedAt: Date;
  }[];
}) {
  if (latest.length === 0) {
    return (
      <section className="glass-apple rounded-2xl p-5 text-sm text-muted-foreground">
        No snapshots yet. Capture one above.
      </section>
    );
  }
  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl">
      <header className="border-b border-white/[0.06] px-5 py-3">
        <h3 className="text-sm font-semibold">Latest SERP snapshots</h3>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Query</th>
              <th className="px-4 py-2 text-center">Pos</th>
              <th className="px-4 py-2 text-center">AIO</th>
              <th className="px-4 py-2 text-center">in AIO</th>
              <th className="px-4 py-2 text-center">FS</th>
              <th className="px-4 py-2 text-center">own FS</th>
              <th className="px-4 py-2 text-right">PAA</th>
              <th className="px-4 py-2 text-right">When</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((s) => (
              <tr
                key={`${s.query}|${s.capturedAt.toISOString()}`}
                className="border-t border-white/[0.04]"
              >
                <td className="px-4 py-1.5 font-medium">
                  {s.query} <span className="text-[10px] text-muted-foreground">({s.country})</span>
                </td>
                <td className="px-4 py-1.5 text-center tabular-nums">
                  {s.ourPosition ? `#${s.ourPosition}` : "—"}
                </td>
                <Cell value={s.hasAio} />
                <Cell value={s.aioIncludesUs} highlight={s.hasAio} />
                <Cell value={s.hasFeaturedSnippet} />
                <Cell value={s.featuredOwnedByUs} highlight={s.hasFeaturedSnippet} />
                <td className="px-4 py-1.5 text-right text-muted-foreground tabular-nums">
                  {s.paaQuestions.length}
                </td>
                <td className="px-4 py-1.5 text-right text-muted-foreground">
                  {s.capturedAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Cell({ value, highlight }: { value: boolean; highlight?: boolean }) {
  return (
    <td className="px-4 py-1.5 text-center">
      {value ? (
        <CheckCircle2 className={`mx-auto size-3 ${highlight === false ? "text-amber-300" : "text-emerald-300"}`} />
      ) : (
        <XCircle className="mx-auto size-3 text-muted-foreground/40" />
      )}
    </td>
  );
}
