export const dynamic = "force-dynamic";

import { Newspaper } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { HeadlineForm } from "./form";

export default function NewsHeadlinePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="News SEO — headline audit"
        description="Score a journalistic headline. Length, Top Stories fit (30-110 chars sweet spot), AP-style hook, primary keyword placement. AI suggests 3-5 alternates."
        icon={Newspaper}
        accent="rose"
      />
      <HeadlineForm />
    </div>
  );
}
