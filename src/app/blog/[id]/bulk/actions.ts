"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, contentBriefs } from "@/db/schema";
import {
  analyzeSiteForBlogContext,
  refineTitle,
  suggestBulkBlogTopics,
  type BulkBlogTopic,
  type SiteBlogContext,
} from "@/lib/bulk-blog-planner";
import { writeBlogPost } from "@/lib/blog-writer";

export type AnalyzeState =
  | { ok: true; ctx: SiteBlogContext }
  | { ok: false; error: string }
  | null;

export async function analyzeSite(
  _prev: AnalyzeState,
  formData: FormData,
): Promise<AnalyzeState> {
  const clientId = Number(formData.get("clientId"));
  if (!Number.isFinite(clientId) || clientId <= 0)
    return { ok: false, error: "Bad client id." };
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) return { ok: false, error: "Client not found." };

  const ctx = await analyzeSiteForBlogContext(client.url);
  if (!ctx)
    return {
      ok: false,
      error: "Couldn't analyze the site. Check the client URL.",
    };
  return { ok: true, ctx };
}

export type SuggestState =
  | { ok: true; topics: BulkBlogTopic[] }
  | { ok: false; error: string }
  | null;

export async function suggestTopics(
  _prev: SuggestState,
  formData: FormData,
): Promise<SuggestState> {
  const clientId = Number(formData.get("clientId"));
  const count = Number(formData.get("count"));
  const ctxJson = String(formData.get("ctx") ?? "");
  const hints = String(formData.get("hints") ?? "");
  if (!Number.isFinite(clientId) || clientId <= 0)
    return { ok: false, error: "Bad client id." };
  if (!ctxJson) return { ok: false, error: "Missing site context." };
  let ctx: SiteBlogContext;
  try {
    ctx = JSON.parse(ctxJson) as SiteBlogContext;
  } catch {
    return { ok: false, error: "Couldn't parse site context." };
  }
  const safe = Math.max(1, Math.min(20, Math.round(count) || 5));
  const topics = await suggestBulkBlogTopics(ctx, safe, hints || undefined);
  if (topics.length === 0)
    return {
      ok: false,
      error: "AI returned no topics. Configure an AI provider in Settings.",
    };
  return { ok: true, topics };
}

export type DraftState =
  | {
      ok: true;
      briefId: number;
      markdown: string;
      title: string;
      targetKeyword: string;
    }
  | { ok: false; error: string }
  | null;

export async function generateAndSaveDraft(
  _prev: DraftState,
  formData: FormData,
): Promise<DraftState> {
  const clientId = Number(formData.get("clientId"));
  const title = String(formData.get("title") ?? "").trim();
  const targetKeyword = String(formData.get("targetKeyword") ?? "").trim();
  const supporting = String(formData.get("supportingKeywords") ?? "").trim();
  const angle = String(formData.get("angle") ?? "").trim();
  const wordCountRaw = Number(formData.get("wordCount"));
  const tone =
    (String(formData.get("tone") ?? "professional") as
      | "professional"
      | "casual"
      | "authoritative"
      | "friendly") ?? "professional";
  const audienceLevel =
    (String(formData.get("audienceLevel") ?? "intermediate") as
      | "beginner"
      | "intermediate"
      | "expert") ?? "intermediate";
  const wordCount: 800 | 1200 | 1500 | 2000 = ([800, 1200, 1500, 2000].includes(
    wordCountRaw,
  )
    ? wordCountRaw
    : 1200) as 800 | 1200 | 1500 | 2000;

  if (!Number.isFinite(clientId) || clientId <= 0)
    return { ok: false, error: "Bad client id." };
  if (!title) return { ok: false, error: "Title is required." };
  if (!targetKeyword)
    return { ok: false, error: "Target keyword is required." };

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) return { ok: false, error: "Client not found." };

  const result = await writeBlogPost({
    clientId,
    clientName: client.name,
    clientUrl: client.url,
    niche: client.niche,
    description: client.description,
    techStack: (client.techStack as string[] | null) ?? null,
    targetKeyword,
    supportingKeywords: supporting
      ? supporting.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    tone,
    audienceLevel,
    wordCount,
    notes: [`Suggested H1: ${title}`, angle ? `Angle: ${angle}` : ""]
      .filter(Boolean)
      .join("\n"),
  });
  if (!result.ok) return { ok: false, error: result.error };

  // Use H1 from generated markdown if any, else the user's title
  const h1 = result.markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const finalTitle = h1 || title;

  const inserted = await db
    .insert(contentBriefs)
    .values({
      clientId,
      title: finalTitle,
      targetKeyword,
      status: "draft",
      targetWordCount: wordCount,
      notes: result.markdown,
    })
    .returning({ id: contentBriefs.id });

  revalidatePath(`/blog/${clientId}/bulk`);
  return {
    ok: true,
    briefId: inserted[0].id,
    markdown: result.markdown,
    title: finalTitle,
    targetKeyword,
  };
}

export async function suggestTitleVariants(
  clientId: number,
  ctxJson: string,
  rawTitle: string,
  targetKeyword: string,
): Promise<string[]> {
  if (!Number.isFinite(clientId) || clientId <= 0) return [];
  let ctx: SiteBlogContext;
  try {
    ctx = JSON.parse(ctxJson) as SiteBlogContext;
  } catch {
    return [];
  }
  return refineTitle(ctx, rawTitle, targetKeyword);
}

export async function markBriefPosted(
  briefId: number,
  formData: FormData,
) {
  const url = String(formData.get("publishedUrl") ?? "").trim();
  const [b] = await db
    .select({ clientId: contentBriefs.clientId })
    .from(contentBriefs)
    .where(eq(contentBriefs.id, briefId))
    .limit(1);
  if (!b) return;
  await db
    .update(contentBriefs)
    .set({
      status: "published",
      publishedUrl: url || null,
      updatedAt: new Date(),
    })
    .where(eq(contentBriefs.id, briefId));
  revalidatePath(`/blog/${b.clientId}/bulk`);
}

export async function unmarkBriefPosted(briefId: number) {
  const [b] = await db
    .select({ clientId: contentBriefs.clientId })
    .from(contentBriefs)
    .where(eq(contentBriefs.id, briefId))
    .limit(1);
  if (!b) return;
  await db
    .update(contentBriefs)
    .set({
      status: "draft",
      publishedUrl: null,
      updatedAt: new Date(),
    })
    .where(eq(contentBriefs.id, briefId));
  revalidatePath(`/blog/${b.clientId}/bulk`);
}

export async function deleteBrief(briefId: number) {
  const [b] = await db
    .select({ clientId: contentBriefs.clientId })
    .from(contentBriefs)
    .where(eq(contentBriefs.id, briefId))
    .limit(1);
  if (!b) return;
  await db.delete(contentBriefs).where(eq(contentBriefs.id, briefId));
  revalidatePath(`/blog/${b.clientId}/bulk`);
}

export async function listBriefsForClient(clientId: number) {
  return db
    .select()
    .from(contentBriefs)
    .where(and(eq(contentBriefs.clientId, clientId)))
    .orderBy(desc(contentBriefs.createdAt));
}
