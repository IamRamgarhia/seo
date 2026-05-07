export const dynamic = "force-dynamic";

import { GitMerge } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { listGscProperties } from "@/lib/google-oauth";
import { BrandedForm } from "./branded-form";

export default async function BrandedSplitPage() {
  let properties: { siteUrl: string }[] = [];
  try {
    properties = await listGscProperties();
  } catch {
    properties = [];
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Branded vs non-branded GSC split"
        description="Compare branded queries vs non-branded over 28 days, with delta vs prior 28 days. Brand drops mean a reputation problem; non-brand drops mean a content/SEO problem — different fixes."
        icon={GitMerge}
        accent="amber"
      />
      {properties.length === 0 ? (
        <div className="glass-apple rounded-2xl p-5 text-sm text-muted-foreground">
          Connect Google Search Console first — Settings → Google.
        </div>
      ) : (
        <BrandedForm properties={properties.map((p) => p.siteUrl)} />
      )}
    </div>
  );
}
