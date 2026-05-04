export const dynamic = "force-dynamic";

import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { ContentHelpers } from "./content-helpers";

export default function ContentHelpersPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Content helpers — cover-image prompts + category / tag suggester"
        description="Two AI helpers for every post you publish. Cover-image prompts in 3 distinct styles you can paste straight into Stable Diffusion / Midjourney / DALL-E. Category and tag suggestions tailored to your existing taxonomy."
        icon={Sparkles}
        accent="rose"
      />
      <ContentHelpers />
    </div>
  );
}
