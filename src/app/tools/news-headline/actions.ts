"use server";

import {
  auditNewsHeadline,
  type HeadlineAudit,
} from "@/lib/content-ai-helpers";

export type HeadState =
  | { ok: true; audit: HeadlineAudit }
  | { ok: false; error: string };

export async function runHeadline(
  _prev: HeadState | null,
  formData: FormData,
): Promise<HeadState> {
  const headline = String(formData.get("headline") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim() || undefined;
  if (!headline) return { ok: false, error: "Headline required." };
  const r = await auditNewsHeadline({ headline, topic });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, audit: r.audit };
}
