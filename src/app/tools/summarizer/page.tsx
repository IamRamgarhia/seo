export const dynamic = "force-dynamic";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { SummarizerForm } from "./form";

export default function SummarizerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="AI content summarizer"
        description="Paste content (or pull from URL). AI returns a TL;DR, 5-7 key takeaways, a 150-160 char meta description, and a tweetable quote. Same as Yoast Premium AI Summarize, free in our tool."
        icon={FileText}
        accent="cyan"
      />
      <SummarizerForm />
    </div>
  );
}
