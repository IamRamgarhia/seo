export const dynamic = "force-dynamic";

import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import {
  findFeaturedSnippetOpportunities,
  listAllPaaQuestions,
  summarizeSerpFeatures,
} from "@/lib/serp-feature-tracker";
import { getSetting } from "@/lib/settings-store";
import { CaptureForm } from "./capture-form";
import { LatestSnapshots } from "./latest";
import { OpportunitiesPanel } from "./opportunities";
import { PaaPanel } from "./paa";

export default async function SerpFeaturesPage() {
  const summary = await summarizeSerpFeatures();
  const ourDomain = (await getSetting<string>("brand.name")) ?? "";
  const opportunities = ourDomain
    ? await findFeaturedSnippetOpportunities({ ourDomain })
    : [];
  const paaQuestions = await listAllPaaQuestions();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="SERP feature tracker"
        description="One tool, three jobs: AI Overview presence + citation tracking, featured snippet hunter, People-Also-Ask question miner. Type a query → we scrape live, store the snapshot, surface opportunities. Free, browser-mode."
        icon={Sparkles}
        accent="rose"
      />

      <CaptureForm />

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Tracked queries" value={summary.total.toString()} />
        <Stat label="With AIO" value={summary.withAio.toString()} hint={summary.total > 0 ? `${Math.round((summary.withAio / summary.total) * 100)}%` : "—"} tone="rose" />
        <Stat label="Cited in AIO" value={summary.citedInAio.toString()} tone="emerald" />
        <Stat label="With FS" value={summary.withFeatured.toString()} />
        <Stat label="We own FS" value={summary.ownFeatured.toString()} tone="emerald" />
        <Stat label="PAA collected" value={summary.paaTotal.toString()} />
      </div>

      <OpportunitiesPanel opportunities={opportunities} />
      <LatestSnapshots latest={summary.latest} />
      <PaaPanel questions={paaQuestions} />
    </div>
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
    <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${t}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
