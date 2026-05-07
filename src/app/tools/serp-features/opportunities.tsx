import { TrendingUp } from "lucide-react";

export function OpportunitiesPanel({
  opportunities,
}: {
  opportunities: {
    query: string;
    ourPosition: number;
    competitorUrl: string;
    competitorDomain: string;
    capturedAt: Date;
  }[];
}) {
  if (opportunities.length === 0) return null;
  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl">
      <header className="border-b border-white/[0.06] px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="size-4 text-emerald-300" />
          Featured snippet opportunities ({opportunities.length})
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          You rank #2-5 with a competitor in the snippet. Match their format
          (40-60 word direct-answer paragraph for paragraph snippets, ordered
          list for list snippets) and re-publish to take it.
        </p>
      </header>
      <ul className="divide-y divide-white/[0.05]">
        {opportunities.map((o) => (
          <li
            key={o.query}
            className="grid grid-cols-[2fr_auto_2fr_auto] gap-3 px-5 py-2 text-xs"
          >
            <span className="font-medium">{o.query}</span>
            <span className="text-amber-300 tabular-nums">pos #{o.ourPosition}</span>
            <a
              href={o.competitorUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-muted-foreground hover:underline"
            >
              {o.competitorDomain}
            </a>
            <span className="text-[10px] text-muted-foreground">
              {o.capturedAt.toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
