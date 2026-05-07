"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { auditIssues } from "@/db/schema";
import { runAiSiteAudit } from "@/lib/ai-site-audit";

export type StartState =
  | { ok: true; auditId: number }
  | { ok: false; error: string };

export async function startAiAudit(
  _prev: StartState | null,
  formData: FormData,
): Promise<StartState> {
  const clientId = Number(formData.get("clientId"));
  const url = String(formData.get("url") ?? "").trim();
  if (!Number.isFinite(clientId) || clientId <= 0)
    return { ok: false, error: "Invalid client ID." };
  if (!url) return { ok: false, error: "URL required." };

  try {
    const r = await runAiSiteAudit({ clientId, url });
    if (!r.ok || !r.auditId)
      return { ok: false, error: r.error ?? "Audit failed" };
    revalidatePath(`/clients/${clientId}/ai-audit`);
    revalidatePath(`/clients/${clientId}/ai-audit/${r.auditId}`);
    return { ok: true, auditId: r.auditId };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "Audit failed" };
  }
}

export async function toggleResolved(
  issueId: number,
  resolved: boolean,
): Promise<{ ok: true }> {
  await db
    .update(auditIssues)
    .set({ status: resolved ? "resolved" : "new" })
    .where(eq(auditIssues.id, issueId));
  revalidatePath("/clients");
  return { ok: true };
}

export async function saveIssueNotes(
  issueId: number,
  notes: string,
): Promise<{ ok: true }> {
  await db
    .update(auditIssues)
    .set({ notes: notes.trim() || null })
    .where(eq(auditIssues.id, issueId));
  return { ok: true };
}
