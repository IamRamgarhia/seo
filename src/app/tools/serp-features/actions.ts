"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  captureSerpSnapshot,
  deleteSnapshot,
} from "@/lib/serp-feature-tracker";

const captureSchema = z.object({
  query: z.string().trim().min(2).max(200),
  country: z.string().trim().min(2).max(4).default("US"),
  ourDomain: z.string().trim().optional(),
});

export type CaptureState =
  | { ok: true; snapshotId: number }
  | { ok: false; error: string };

export async function runCapture(
  _prev: CaptureState | null,
  formData: FormData,
): Promise<CaptureState> {
  const parsed = captureSchema.safeParse({
    query: formData.get("query"),
    country: formData.get("country") || "US",
    ourDomain: formData.get("ourDomain") || undefined,
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const r = await captureSerpSnapshot({
    query: parsed.data.query,
    country: parsed.data.country,
    ourDomain: parsed.data.ourDomain,
  });
  revalidatePath("/tools/serp-features");
  if (!r.ok) return { ok: false, error: r.error ?? "Capture failed" };
  return { ok: true, snapshotId: r.snapshotId! };
}

export async function removeSnapshot(id: number): Promise<{ ok: true }> {
  await deleteSnapshot(id);
  revalidatePath("/tools/serp-features");
  return { ok: true };
}
