"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  findLowCtrCandidates,
  type BatchResult,
} from "@/lib/meta-rewrite-batch";
import { pushWpFix } from "@/app/clients/[id]/wp-actions";
import { logActivity } from "@/lib/activity";

const findSchema = z.object({
  clientId: z.coerce.number().int().positive(),
});

export type FindState =
  | { ok: true; result: BatchResult }
  | { ok: false; error: string };

export async function findCandidates(
  _prev: FindState | null,
  formData: FormData,
): Promise<FindState> {
  const parsed = findSchema.safeParse({
    clientId: formData.get("clientId"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const result = await findLowCtrCandidates({
      clientId: parsed.data.clientId,
      limit: 10,
    });
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "Find failed" };
  }
}

const applySchema = z.object({
  clientId: z.coerce.number().int().positive(),
  url: z.string().trim().min(3),
  title: z.string().trim().min(8).max(200),
  meta: z.string().trim().min(30).max(300),
});

export type ApplyState =
  | { ok: true; postId?: number }
  | { ok: false; error: string };

/**
 * Push the chosen rewrite to the live site via the WP bridge. Reuses
 * the existing pushWpFix server action — sends two updates back-to-back
 * (title, then meta description) so revisions log them separately.
 */
export async function applyRewrite(
  _prev: ApplyState | null,
  formData: FormData,
): Promise<ApplyState> {
  const parsed = applySchema.safeParse({
    clientId: formData.get("clientId"),
    url: formData.get("url"),
    title: formData.get("title"),
    meta: formData.get("meta"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { clientId, url, title, meta } = parsed.data;

  // Build a synthetic FormData per fix and call pushWpFix
  async function push(fixType: "title" | "meta_description", value: string) {
    const fd = new FormData();
    fd.set("clientId", String(clientId));
    fd.set("url", url);
    fd.set("fixType", fixType);
    fd.set("value", value);
    return pushWpFix(null, fd);
  }

  const titleResult = await push("title", title);
  if (!titleResult.ok) {
    return { ok: false, error: `Title push failed — ${titleResult.error}` };
  }
  const metaResult = await push("meta_description", meta);
  if (!metaResult.ok) {
    return {
      ok: false,
      error: `Title pushed, but meta description failed — ${metaResult.error}`,
    };
  }

  await logActivity({
    kind: "task.completed",
    message: `Meta rewrite applied to ${url}`,
    level: "success",
    clientId: clientId,
    entityType: "wp_bridge",
  });

  revalidatePath(`/meta-rewrite/c/${clientId}`);
  return { ok: true, postId: titleResult.postId };
}
