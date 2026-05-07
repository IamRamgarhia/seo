export const dynamic = "force-dynamic";

import { Globe } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { HreflangForm } from "./form";

export default function HreflangGenPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Hreflang generator"
        description="Paste a list of language-region pairs and URLs. We emit the full hreflang block (HTML + HTTP-header + sitemap formats) with x-default validation. Avoids the silent self-reference bug that breaks 60% of hand-written hreflang implementations."
        icon={Globe}
        accent="cyan"
      />
      <HreflangForm />
    </div>
  );
}
