"use server";

import { z } from "zod";
import { measureCwv, type CwvResult } from "@/lib/local-cwv";

const inputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(3)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.string().url()),
  device: z.enum(["mobile", "desktop"]).default("mobile"),
});

export type LocalCwvState =
  | { ok: true; result: CwvResult }
  | { ok: false; error: string };

export async function runLocalCwv(
  _prev: LocalCwvState | null,
  formData: FormData,
): Promise<LocalCwvState> {
  const parsed = inputSchema.safeParse({
    url: formData.get("url"),
    device: formData.get("device") || "mobile",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const result = await measureCwv(parsed.data.url, {
      device: parsed.data.device,
    });
    if (!result.ok && result.error) return { ok: false, error: result.error };
    return { ok: true, result };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message ?? "CWV measurement failed",
    };
  }
}
