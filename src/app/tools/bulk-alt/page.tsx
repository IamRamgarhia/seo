export const dynamic = "force-dynamic";

import { Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { BulkAltForm } from "./form";

export default function BulkAltPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Bulk image alt-text generator"
        description="Paste any URL — we crawl every <img>, AI generates SEO-friendly alt text for each based on nearby context. Replaces RankMath's bulk image SEO. Copy the output to your CMS or run via the WP bridge."
        icon={ImageIcon}
        accent="emerald"
      />
      <BulkAltForm />
    </div>
  );
}
