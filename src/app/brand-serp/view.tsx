"use client";

import { useState, useTransition } from "react";
import { Crown, Loader2, Play, Shield, ShieldOff } from "lucide-react";
import { captureBrandSerp, type BrandSerpResult } from "./actions";
import type { ClientSocialLinks } from "@/db/schema";

const TONE: Record<string, string> = {
  domain: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  social: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  knowledge: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  "third-party": "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

export function BrandSerpView({
  clients,
}: {
  clients: {
    id: number;
    name: string;
    url: string;
    socialLinks: ClientSocialLinks | null;
  }[];
}) {
  const [picked, setPicked] = useState<number | null>(clients[0]?.id ?? null);
  const [result, setResult] = useState<BrandSerpResult | null>(null);
  const [pending, startScan] = useTransition();

  function scan() {
    if (!picked) return;
    setResult(null);
    startScan(async () => {
      const r = await captureBrandSerp(picked);
      setResult(r);
    });
  }

  if (clients.length === 0) {
    return (
      <p className="rounded-md bg-white/[0.02] px-3 py-2 text-sm text-muted-foreground">
        Add a client first.
      </p>
    );
  }

  return (
    <>
      <section className="glass-apple relative overflow-hidden rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_140px]">
          <select
            value={picked ?? ""}
            onChange={(e) => setPicked(Number(e.target.value))}
            className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.url.replace(/^https?:\/\//, "")})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={scan}
            disabled={pending || !picked}
            className="inline-flex h-9 items-center justify-center rounded-md bg-amber-500/15 px-4 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/25 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 size-3 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Play className="mr-2 size-3" />
                Capture brand SERP
              </>
            )}
          </button>
        </div>
      </section>

      {result && !result.ok && (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
          {result.error}
        </p>
      )}

      {result?.ok && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Brand" value={result.brand} />
            <Stat label="Top-10 owned" value={`${result.ownership.owned} / ${result.ownership.total}`} tone={result.ownership.pct >= 50 ? "emerald" : "amber"} />
            <Stat
              label="Control"
              value={`${result.ownership.pct.toFixed(0)}%`}
              tone={result.ownership.pct >= 50 ? "emerald" : "rose"}
              hint="goal: 50%+"
            />
            <Stat
              label="Third-party"
              value={result.ownership.thirdParty.toString()}
              tone={result.ownership.thirdParty <= 5 ? "emerald" : "amber"}
            />
          </div>

          <section className="glass-apple relative overflow-hidden rounded-2xl">
            <header className="border-b border-white/[0.06] px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Crown className="size-4 text-amber-300" />
                First-page SERP
              </h3>
            </header>
            <ul className="divide-y divide-white/[0.05]">
              {result.results.map((r) => (
                <li
                  key={`${r.position}-${r.url}`}
                  className="grid grid-cols-[40px_1fr_auto] gap-3 items-start px-5 py-2.5 text-xs"
                >
                  <span className="text-muted-foreground tabular-nums">
                    #{r.position}
                  </span>
                  <div className="min-w-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium hover:underline"
                    >
                      {r.title}
                    </a>
                    <code className="block truncate text-[10px] text-muted-foreground">
                      {r.url}
                    </code>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ring-1 ring-inset ${TONE[r.isOwned]}`}
                  >
                    {r.isOwned === "third-party" ? (
                      <ShieldOff className="size-3" />
                    ) : (
                      <Shield className="size-3" />
                    )}
                    {r.isOwned}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-2">
            <h3 className="text-sm font-semibold">How to improve brand SERP control</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Claim + verify a Wikidata entry for entity-level recognition</li>
              <li>• Maintain LinkedIn Company / Crunchbase / GitHub / Twitter — link them via Organization schema sameAs on your home page</li>
              <li>• Earn Wikipedia mention with notable cited sources</li>
              <li>• Publish branded YouTube content — videos almost always make page 1</li>
              <li>• Address negative third-party results with original content (don&apos;t try to demote — outrank with better)</li>
            </ul>
          </section>
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
  const t = tone
    ? { emerald: "text-emerald-300", amber: "text-amber-300", rose: "text-rose-300" }[tone]
    : "";
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-base font-semibold tabular-nums ${t}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
