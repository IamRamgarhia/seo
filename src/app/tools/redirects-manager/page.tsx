export const dynamic = "force-dynamic";

import { desc } from "drizzle-orm";
import { CornerDownRight } from "lucide-react";
import { db } from "@/db/client";
import { redirectRules, notFoundLog } from "@/db/schema";
import { PageHeader } from "@/components/shell/page-header";
import { Manager } from "./manager";

export default async function RedirectsManagerPage() {
  const rules = await db
    .select()
    .from(redirectRules)
    .orderBy(desc(redirectRules.createdAt))
    .limit(500);
  const notFound = await db
    .select()
    .from(notFoundLog)
    .orderBy(desc(notFoundLog.lastSeen))
    .limit(200);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Redirect manager + 404 monitor"
        description="Central CRUD for 301/302/307/308/410 redirects. Plus a 404 log — every page visitors hit that doesn't exist, with one-click 'create redirect from this hit' resolution. POST /api/v1/track-404 from your site to log automatically."
        icon={CornerDownRight}
        accent="amber"
      />
      <Manager rules={rules} notFound={notFound} />
    </div>
  );
}
