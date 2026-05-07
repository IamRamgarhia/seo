export const dynamic = "force-dynamic";

import { Link2 } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { AutoLinkForm } from "./form";

export default function AutoLinkPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Auto-link suggester (RankMath-style)"
        description="Paste content + your site's internal page list. AI proposes contextual internal links — exact anchor text + target URL — that you can apply manually or push via the WP bridge."
        icon={Link2}
        accent="violet"
      />
      <AutoLinkForm />
    </div>
  );
}
