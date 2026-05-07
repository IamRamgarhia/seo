"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { redirectRules, notFoundLog } from "@/db/schema";

export async function addRule(formData: FormData) {
  const sourcePath = String(formData.get("sourcePath") ?? "").trim();
  const targetUrl = String(formData.get("targetUrl") ?? "").trim();
  const statusCode = Number(formData.get("statusCode") ?? 301);
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!sourcePath || !targetUrl)
    return { ok: false as const, error: "Source path + target URL required." };
  if (!sourcePath.startsWith("/"))
    return { ok: false as const, error: "Source path must start with /" };
  if (!/^https?:\/\//i.test(targetUrl) && !targetUrl.startsWith("/"))
    return { ok: false as const, error: "Target must be absolute URL or /-prefixed path." };
  if (![301, 302, 307, 308, 410].includes(statusCode))
    return { ok: false as const, error: "Status code must be 301/302/307/308/410." };
  await db.insert(redirectRules).values({
    sourcePath,
    targetUrl,
    statusCode,
    note,
  });
  revalidatePath("/tools/redirects-manager");
  return { ok: true as const };
}

export async function deleteRule(id: number) {
  await db.delete(redirectRules).where(eq(redirectRules.id, id));
  revalidatePath("/tools/redirects-manager");
}

export async function record404(formData: FormData) {
  const sourcePath = String(formData.get("sourcePath") ?? "").trim();
  if (!sourcePath) return { ok: false as const };
  const [existing] = await db
    .select()
    .from(notFoundLog)
    .where(eq(notFoundLog.sourcePath, sourcePath))
    .limit(1);
  if (existing) {
    await db
      .update(notFoundLog)
      .set({ hits: existing.hits + 1, lastSeen: new Date() })
      .where(eq(notFoundLog.id, existing.id));
  } else {
    await db.insert(notFoundLog).values({
      sourcePath,
    });
  }
  revalidatePath("/tools/redirects-manager");
  return { ok: true as const };
}

export async function resolve404(formData: FormData) {
  const id = Number(formData.get("id"));
  const targetUrl = String(formData.get("targetUrl") ?? "").trim();
  if (!Number.isFinite(id) || !targetUrl) return { ok: false as const };
  const [row] = await db
    .select()
    .from(notFoundLog)
    .where(eq(notFoundLog.id, id))
    .limit(1);
  if (!row) return { ok: false as const };
  await db.insert(redirectRules).values({
    sourcePath: row.sourcePath,
    targetUrl,
    statusCode: 301,
    note: `Auto-created from 404 log (${row.hits} hits)`,
  });
  await db
    .update(notFoundLog)
    .set({ resolved: true, resolvedToUrl: targetUrl })
    .where(eq(notFoundLog.id, id));
  revalidatePath("/tools/redirects-manager");
  return { ok: true as const };
}

export async function deleteNotFound(id: number) {
  await db.delete(notFoundLog).where(eq(notFoundLog.id, id));
  revalidatePath("/tools/redirects-manager");
}
