export const dynamic = "force-dynamic";

import { Camera } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { RenderForm } from "./render-form";

export default function RenderPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="JS render + screenshot"
        description="Render any URL in headless Chrome (post-hydration HTML, full screenshot, redirect chain, response headers, console errors). Critical for SPAs / JS-heavy sites where a curl-style fetch shows you nothing."
        icon={Camera}
        accent="cyan"
      />
      <RenderForm />
    </div>
  );
}
