"use client";

import { useMemo, useState } from "react";
import { GitMerge } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";

/**
 * Tiny line-level diff using the LCS algorithm. Same approach as the
 * canonical Hunt-McIlroy diff, simplified — we don't need word-level here.
 */
function lineDiff(
  a: string,
  b: string,
): { kind: "same" | "add" | "del"; text: string }[] {
  const la = a.split("\n");
  const lb = b.split("\n");
  const n = la.length;
  const m = lb.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (la[i] === lb[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: { kind: "same" | "add" | "del"; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (la[i] === lb[j]) {
      out.push({ kind: "same", text: la[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: "del", text: la[i] });
      i++;
    } else {
      out.push({ kind: "add", text: lb[j] });
      j++;
    }
  }
  while (i < n) out.push({ kind: "del", text: la[i++] });
  while (j < m) out.push({ kind: "add", text: lb[j++] });
  return out;
}

export default function TextDiffPage() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const diff = useMemo(() => lineDiff(a, b), [a, b]);
  const adds = diff.filter((d) => d.kind === "add").length;
  const dels = diff.filter((d) => d.kind === "del").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Text diff"
        description="Line-level diff between two pieces of text. Useful for comparing two versions of meta tags, two competitor titles, or copy edits."
        icon={GitMerge}
        accent="cyan"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <textarea
          value={a}
          onChange={(e) => setA(e.target.value)}
          rows={14}
          placeholder="Original text…"
          className="w-full rounded-2xl border border-white/10 bg-card/60 p-4 font-mono text-[12px] focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <textarea
          value={b}
          onChange={(e) => setB(e.target.value)}
          rows={14}
          placeholder="Modified text…"
          className="w-full rounded-2xl border border-white/10 bg-card/60 p-4 font-mono text-[12px] focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {adds} additions · {dels} deletions
      </div>
      <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-[12px] leading-relaxed">
        {diff.map((d, i) => (
          <div
            key={i}
            className={
              d.kind === "add"
                ? "bg-emerald-500/10 text-emerald-200"
                : d.kind === "del"
                  ? "bg-rose-500/10 text-rose-200 line-through opacity-80"
                  : "text-muted-foreground/80"
            }
          >
            {d.kind === "add" ? "+ " : d.kind === "del" ? "- " : "  "}
            {d.text || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}
