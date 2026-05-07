export const dynamic = "force-dynamic";

import { Activity } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { targetSummary } from "@/lib/uptime";
import { UptimeManager } from "./manager";

export default async function UptimePage() {
  const summary = await targetSummary();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Uptime + TTFB monitor"
        description="Add URLs we should ping. Each ping records status, latency, expected-text match. Free, self-hosted alternative to UptimeRobot / Pingdom — runs from your server."
        icon={Activity}
        accent="emerald"
      />
      <UptimeManager initial={summary} />
    </div>
  );
}
