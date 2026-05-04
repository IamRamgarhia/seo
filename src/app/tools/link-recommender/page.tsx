export const dynamic = "force-dynamic";

import { Link2 } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { RecommenderForm } from "./recommender-form";

export default function LinkRecommenderPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="AI internal-link recommender"
        description="Paste a draft + the site you'll publish on. The tool crawls existing pages, ranks them by relevance, and the AI proposes specific anchor texts + which existing page each link should point to."
        icon={Link2}
        accent="violet"
      />
      <RecommenderForm />
    </div>
  );
}
