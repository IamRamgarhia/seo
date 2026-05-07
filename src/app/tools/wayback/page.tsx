export const dynamic = "force-dynamic";

import { History } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { WaybackForm } from "./form";

export default function WaybackPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Wayback Machine timeline"
        description="See how a page evolved over years. Pulls Internet Archive CDX (free, no key). Critical when investigating ranking drops, content changes by competitors, or your own historical content."
        icon={History}
        accent="violet"
      />
      <WaybackForm />
    </div>
  );
}
