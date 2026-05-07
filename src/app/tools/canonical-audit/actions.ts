"use server";

import { z } from "zod";
import { auditCanonicals, type CanonicalAuditResult } from "@/lib/canonical-audit";

const schema = z.object({
  startUrl: z
    .string()
    .trim()
    .min(3)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.string().url()),
  maxPages: z.coerce.number().int().min(20).max(200).default(80),
});

export type CanonState =
  | { ok: true; result: CanonicalAuditResult }
  | { ok: false; error: string };

export async function runCanonical(
  _prev: CanonState | null,
  formData: FormData,
): Promise<CanonState> {
  const parsed = schema.safeParse({
    startUrl: formData.get("startUrl"),
    maxPages: formData.get("maxPages") || 80,
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const r = await auditCanonicals(parsed.data);
  if (!r.ok && r.error) return { ok: false, error: r.error };
  return { ok: true, result: r };
}
