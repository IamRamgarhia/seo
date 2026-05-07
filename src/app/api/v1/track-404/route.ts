import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { notFoundLog } from "@/db/schema";
import {
  authenticateRequest,
  jsonError,
  jsonOk,
  requireScope,
} from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = await authenticateRequest(req);
  if (!key) return jsonError(401, "Unauthorized");
  if (!requireScope(key, "write"))
    return jsonError(403, "Write scope required.");

  let body: { sourcePath?: string; clientId?: number } = {};
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Body must be JSON.");
  }
  const sourcePath = String(body.sourcePath ?? "").trim();
  if (!sourcePath || !sourcePath.startsWith("/"))
    return jsonError(400, "sourcePath required (must start with /).");

  const [existing] = await db
    .select()
    .from(notFoundLog)
    .where(eq(notFoundLog.sourcePath, sourcePath))
    .limit(1);
  if (existing) {
    await db
      .update(notFoundLog)
      .set({
        hits: sql`${notFoundLog.hits} + 1`,
        lastSeen: new Date(),
      })
      .where(eq(notFoundLog.id, existing.id));
    return jsonOk({ ok: true, id: existing.id, hits: existing.hits + 1 });
  }
  const [inserted] = await db
    .insert(notFoundLog)
    .values({
      sourcePath,
      clientId: body.clientId ?? null,
    })
    .returning();
  return jsonOk({ ok: true, id: inserted?.id, hits: 1 });
}
