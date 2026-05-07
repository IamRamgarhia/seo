export const dynamic = "force-dynamic";

import { GitMerge } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { CanonForm } from "./form";

export default function CanonicalAuditPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Canonical conflict detector"
        description="Crawl a site, flag every page where rel=canonical points somewhere broken: missing entirely, multiple tags, off-host, broken target, redirect target, self-mismatch (different trailing slash / scheme / casing), or noindex+canonical conflict. Catches the silent SEO bug that kills indexation."
        icon={GitMerge}
        accent="amber"
      />
      <CanonForm />
    </div>
  );
}
