"use server";

import { summarizeContent, type Summary } from "@/lib/content-ai-helpers";

export type SumState =
  | { ok: true; summary: Summary }
  | { ok: false; error: string };

export async function runSummarize(
  _prev: SumState | null,
  formData: FormData,
): Promise<SumState> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { ok: false, error: "Paste some content." };
  const r = await summarizeContent({ text });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, summary: r.summary };
}
