export const dynamic = "force-dynamic";

import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { EeatForm } from "./eeat-form";

export default function EeatAuditPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="E-E-A-T audit"
        description="Score any URL on Experience, Expertise, Authoritativeness, and Trust signals — Google's quality-rater framework. We detect bylines, bios, schema, citations, and trust pages, then AI writes a concrete fix punch list."
        icon={ShieldCheck}
        accent="emerald"
      />
      <EeatForm />
    </div>
  );
}
