export const dynamic = "force-dynamic";

import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { RefreshForm } from "./refresh-form";

export default function RefreshDetectorPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Content refresh detector"
        description="Compare your published page to the current top-10 SERP. Surfaces missing topics, missing sections, and a concrete refresh plan you can hand to a writer or do yourself."
        icon={RefreshCw}
        accent="amber"
      />
      <RefreshForm />
    </div>
  );
}
