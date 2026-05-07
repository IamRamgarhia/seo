export const dynamic = "force-dynamic";

import { GitMerge } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { ParityForm } from "./parity-form";

export default function MigrationParityPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Migration URL-parity auditor"
        description="Paste your pre-migration URL list. We hit each one, follow redirects, surface what's broken / unredirected / drifted off-host. Run pre-launch and post-launch — the diff is your migration QA."
        icon={GitMerge}
        accent="amber"
      />
      <ParityForm />
    </div>
  );
}
