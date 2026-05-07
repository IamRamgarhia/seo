export const dynamic = "force-dynamic";

import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { LocalCwvForm } from "./local-cwv-form";

export default function LocalCwvPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Local Core Web Vitals (no PSI key)"
        description="Renders any URL in headless Chrome, measures LCP / FCP / CLS / TBT / TTFB directly from the PerformanceObserver, and computes a Lighthouse-equivalent 0-100 score. No PageSpeed key, no API quota — just runs locally on demand."
        icon={Gauge}
        accent="amber"
      />
      <LocalCwvForm />
    </div>
  );
}
