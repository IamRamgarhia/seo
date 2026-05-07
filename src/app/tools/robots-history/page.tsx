export const dynamic = "force-dynamic";

import { History } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { listAllHosts } from "@/lib/robots-snapshots";
import { RobotsTracker } from "./tracker";

export default async function RobotsHistoryPage() {
  const hosts = await listAllHosts();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="robots.txt history + diff"
        description="Snapshot any host's robots.txt. Each snapshot is hashed; we only store the body when it actually changes. Catches accidental Disallow: / disasters before they hurt indexing."
        icon={History}
        accent="amber"
      />
      <RobotsTracker initialHosts={hosts} />
    </div>
  );
}
