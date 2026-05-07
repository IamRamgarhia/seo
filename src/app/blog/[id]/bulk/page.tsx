export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wand2 } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { PageHeader } from "@/components/shell/page-header";
import { listBriefsForClient } from "./actions";
import { BulkBlogWizard } from "./wizard";

export default async function BulkBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isFinite(clientId) || clientId <= 0) notFound();
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) notFound();

  const briefs = await listBriefsForClient(clientId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href={`/blog/${clientId}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Back to single-post writer
      </Link>

      <PageHeader
        title={`Bulk blog plan — ${client.name}`}
        description="AI scans the site, suggests N topic ideas tuned to it, then writes full drafts on demand. Saved drafts persist; flip to 'Posted' once they're live."
        icon={Wand2}
        accent="violet"
      />

      <BulkBlogWizard
        clientId={clientId}
        clientName={client.name}
        clientUrl={client.url}
        briefs={briefs}
      />
    </div>
  );
}
