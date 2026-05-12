/**
 * Per-client daily automation orchestrator.
 *
 * Two responsibilities:
 *   1. tickScheduleGeneration() — find schedules due now, generate the
 *      right kind of content via AI, drop it into publish_queue.
 *   2. tickQueuePublish() — find approved queue items, route each to the
 *      right publisher (WordPress / GBP / etc), mark published or failed.
 *
 * Both are called from daily-agent.ts so the existing 24h ticker drives
 * them. Nothing here runs more often than that.
 */

import { and, asc, eq, lte, or, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  clients,
  dailySchedules,
  publishQueue,
  tasks,
  type DailySchedule,
  type PublishQueueItem,
} from "@/db/schema";
import { callAI } from "./ai-call";
import { logActivity } from "./activity";

const KIND_LABEL = {
  blog_draft: "Blog draft",
  gbp_post: "GBP post",
  social_post: "Social post",
  internal_checklist: "Daily checklist",
} as const;

export type ScheduleKind = keyof typeof KIND_LABEL;

/**
 * Move a schedule's nextRunAt forward by cadenceDays. Called after
 * either successful generation or a failed attempt — either way the
 * next attempt is one cadence in the future, not immediately.
 */
function computeNextRun(s: DailySchedule, from: Date = new Date()): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + Math.max(1, s.cadenceDays));
  // Snap to the schedule's timeUtc (HHMM)
  const hh = Math.floor(s.timeUtc / 100);
  const mm = s.timeUtc % 100;
  next.setUTCHours(hh, mm, 0, 0);
  return next;
}

// ─────────────────────────────────────────────────────────────────────
// Generation phase
// ─────────────────────────────────────────────────────────────────────

export async function tickScheduleGeneration(): Promise<{
  generated: number;
  skipped: number;
}> {
  const now = new Date();
  const due = await db
    .select()
    .from(dailySchedules)
    .where(
      and(
        eq(dailySchedules.enabled, true),
        or(
          isNull(dailySchedules.nextRunAt),
          lte(dailySchedules.nextRunAt, now),
        ),
      ),
    );

  let generated = 0;
  let skipped = 0;
  for (const s of due) {
    try {
      const item = await generateForSchedule(s);
      if (!item) {
        skipped++;
        continue;
      }
      await db.insert(publishQueue).values({
        scheduleId: s.id,
        clientId: s.clientId,
        kind: s.kind,
        status: s.autoPublish ? "approved" : "pending_review",
        title: item.title,
        body: item.body,
        payloadJson: item.payload ?? null,
        scheduledFor: now,
      });
      await db
        .update(dailySchedules)
        .set({
          lastRunAt: now,
          nextRunAt: computeNextRun(s, now),
          updatedAt: now,
        })
        .where(eq(dailySchedules.id, s.id));
      generated++;
    } catch (err) {
      // Schedule a retry one cadence later regardless — don't loop on a
      // permanently-broken schedule.
      await db
        .update(dailySchedules)
        .set({
          lastRunAt: now,
          nextRunAt: computeNextRun(s, now),
          updatedAt: now,
        })
        .where(eq(dailySchedules.id, s.id));
      await logActivity({
        kind: "audit.completed",
        clientId: s.clientId,
        level: "warning",
        message: `Auto-${s.kind}: generation failed — ${(err as Error).message?.slice(0, 200) ?? "unknown"}`,
      });
      skipped++;
    }
  }
  return { generated, skipped };
}

type GeneratedItem = {
  title: string | null;
  body: string;
  payload?: Record<string, unknown>;
};

async function generateForSchedule(
  s: DailySchedule,
): Promise<GeneratedItem | null> {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, s.clientId))
    .limit(1);
  if (!client) return null;

  const cfg = (s.configJson ?? {}) as Record<string, unknown>;
  const topicSeed = String(cfg.topic_seed ?? client.niche ?? "SEO");
  const tone = String(cfg.tone ?? "professional, plain English");

  if (s.kind === "blog_draft") {
    return generateBlogDraft({
      clientName: client.name,
      clientUrl: client.url,
      niche: client.niche ?? null,
      topicSeed,
      tone,
    });
  }
  if (s.kind === "gbp_post") {
    return generateGbpPost({
      clientName: client.name,
      topicSeed,
      tone,
      postType: String(cfg.post_type ?? "STANDARD"),
    });
  }
  if (s.kind === "social_post") {
    return generateSocialPost({
      clientName: client.name,
      clientUrl: client.url,
      topicSeed,
      tone,
    });
  }
  if (s.kind === "internal_checklist") {
    return generateChecklist({
      clientId: s.clientId,
      niche: client.niche ?? null,
    });
  }
  return null;
}

async function generateBlogDraft(opts: {
  clientName: string;
  clientUrl: string;
  niche: string | null;
  topicSeed: string;
  tone: string;
}): Promise<GeneratedItem | null> {
  const system = `You are an expert SEO content writer. Write a single complete blog post in HTML for ${opts.clientName} (${opts.clientUrl}). Tone: ${opts.tone}. 800-1200 words. Include 3-5 H2 subheadings, a 50-word intro, an opening tl;dr summary, and a closing one-paragraph conclusion. Use <p>, <h2>, <ul>, <ol>, <strong>. Never include <html>, <body>, <h1>, or <style> tags — the H1 comes from the title field and styling is handled by the WP theme.`;
  const user = `Topic seed: "${opts.topicSeed}"${opts.niche ? ` (niche: ${opts.niche})` : ""}.

Pick a specific, useful angle the audience would actually search for. Output strict JSON:

{
  "title": "60-char post title",
  "metaDescription": "150-char SEO description",
  "excerpt": "1-sentence WP excerpt (≤180 chars)",
  "contentHtml": "the full body as HTML"
}`;
  const raw = await callAI({
    system,
    user,
    maxTokens: 2500,
    temperature: 0.7,
    timeoutMs: 90_000,
    ignoreCreditSaver: true,
    feature: "blog_draft",
  });
  if (!raw) return null;
  const parsed = extractJson(raw) as {
    title?: string;
    metaDescription?: string;
    excerpt?: string;
    contentHtml?: string;
  } | null;
  if (!parsed || !parsed.title || !parsed.contentHtml) return null;
  return {
    title: parsed.title.slice(0, 200),
    body: parsed.contentHtml,
    payload: {
      metaDescription: (parsed.metaDescription ?? "").slice(0, 200),
      excerpt: (parsed.excerpt ?? "").slice(0, 300),
    },
  };
}

async function generateGbpPost(opts: {
  clientName: string;
  topicSeed: string;
  tone: string;
  postType: string;
}): Promise<GeneratedItem | null> {
  const system = `You write Google Business Profile posts for local businesses. Output ≤ 1300 characters (Google caps at 1500; leave room). Be specific and benefit-led. No emoji spam. No exclamation marks back-to-back. End with a clear next step.`;
  const user = `Business: ${opts.clientName}
Tone: ${opts.tone}
Topic / seed: ${opts.topicSeed}
Post type: ${opts.postType}

Output strict JSON: { "summary": "the post text", "callToAction": "BOOK"|"ORDER"|"SHOP"|"LEARN_MORE"|"SIGN_UP"|"CALL"|null }`;
  const raw = await callAI({
    system,
    user,
    maxTokens: 600,
    temperature: 0.6,
    timeoutMs: 60_000,
    feature: "general",
  });
  if (!raw) return null;
  const parsed = extractJson(raw) as {
    summary?: string;
    callToAction?: string | null;
  } | null;
  if (!parsed || !parsed.summary) return null;
  return {
    title: parsed.summary.slice(0, 80),
    body: parsed.summary.slice(0, 1300),
    payload: { callToAction: parsed.callToAction ?? null, postType: opts.postType },
  };
}

async function generateSocialPost(opts: {
  clientName: string;
  clientUrl: string;
  topicSeed: string;
  tone: string;
}): Promise<GeneratedItem | null> {
  const system = `You write short-form social posts (X/Twitter + LinkedIn) for businesses. Make each platform variant distinct — X is 1-2 punchy lines, LinkedIn is a 3-5 line micro-essay.`;
  const user = `Business: ${opts.clientName}
URL: ${opts.clientUrl}
Tone: ${opts.tone}
Topic / seed: ${opts.topicSeed}

Output strict JSON: { "x": "X post ≤270 chars", "linkedin": "LinkedIn post ≤700 chars" }`;
  const raw = await callAI({
    system,
    user,
    maxTokens: 600,
    temperature: 0.7,
    timeoutMs: 60_000,
    feature: "general",
  });
  if (!raw) return null;
  const parsed = extractJson(raw) as {
    x?: string;
    linkedin?: string;
  } | null;
  if (!parsed || (!parsed.x && !parsed.linkedin)) return null;
  return {
    title: (parsed.x ?? parsed.linkedin ?? "").slice(0, 80),
    body: [
      parsed.x ? `--- X / Twitter ---\n${parsed.x}` : "",
      parsed.linkedin ? `--- LinkedIn ---\n${parsed.linkedin}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    payload: { x: parsed.x ?? null, linkedin: parsed.linkedin ?? null },
  };
}

async function generateChecklist(opts: {
  clientId: number;
  niche: string | null;
}): Promise<GeneratedItem | null> {
  const system = `You are an SEO project manager. Output today's daily checklist for a ${opts.niche ?? "general"} business. Be specific and actionable — never generic SEO advice. 5 items max.`;
  const user = `Output strict JSON: { "items": [{ "title": "≤80 chars", "why": "1 sentence" }, ...] } — 3 to 5 items.`;
  const raw = await callAI({
    system,
    user,
    maxTokens: 600,
    temperature: 0.5,
    timeoutMs: 45_000,
    feature: "general",
  });
  if (!raw) return null;
  const parsed = extractJson(raw) as {
    items?: { title?: string; why?: string }[];
  } | null;
  if (!parsed?.items?.length) return null;
  const items = parsed.items
    .filter((i) => i.title)
    .slice(0, 5)
    .map((i) => ({ title: String(i.title), why: String(i.why ?? "") }));
  return {
    title: `Today's checklist — ${items.length} item${items.length === 1 ? "" : "s"}`,
    body: items.map((i, n) => `${n + 1}. ${i.title}\n   ${i.why}`).join("\n\n"),
    payload: { items },
  };
}

function extractJson(raw: string): unknown {
  // Strip markdown fences if the model wrapped its JSON
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to grabbing the first {...} block
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// Publish phase
// ─────────────────────────────────────────────────────────────────────

export async function tickQueuePublish(): Promise<{
  published: number;
  failed: number;
}> {
  const pending = await db
    .select()
    .from(publishQueue)
    .where(eq(publishQueue.status, "approved"))
    .orderBy(asc(publishQueue.scheduledFor))
    .limit(20); // safety cap per tick

  let published = 0;
  let failed = 0;

  for (const item of pending) {
    const result = await publishOne(item);
    if (result.ok) {
      await db
        .update(publishQueue)
        .set({
          status: "published",
          publishedAt: new Date(),
          publishedRef: result.ref ?? null,
          errorMsg: null,
          updatedAt: new Date(),
        })
        .where(eq(publishQueue.id, item.id));
      await logActivity({
        kind: "audit.completed",
        clientId: item.clientId,
        level: "success",
        message: `Auto-published ${KIND_LABEL[item.kind]}: ${item.title ?? "untitled"}`,
      });
      published++;
    } else {
      await db
        .update(publishQueue)
        .set({
          status: "failed",
          errorMsg: result.error.slice(0, 500),
          updatedAt: new Date(),
        })
        .where(eq(publishQueue.id, item.id));
      await logActivity({
        kind: "audit.completed",
        clientId: item.clientId,
        level: "warning",
        message: `Auto-publish failed (${KIND_LABEL[item.kind]}): ${result.error.slice(0, 200)}`,
      });
      failed++;
    }
  }

  return { published, failed };
}

async function publishOne(
  item: PublishQueueItem,
): Promise<{ ok: true; ref?: string } | { ok: false; error: string }> {
  if (item.kind === "blog_draft") {
    return publishBlog(item);
  }
  if (item.kind === "gbp_post") {
    return publishGbp(item);
  }
  if (item.kind === "social_post") {
    // No auto-OAuth path in v1. Approved social items stay approved as
    // a manual handoff; the queue page surfaces copy-to-clipboard.
    return { ok: false, error: "Social auto-post not configured — copy manually from queue." };
  }
  if (item.kind === "internal_checklist") {
    return publishChecklist(item);
  }
  return { ok: false, error: `Unknown kind: ${item.kind}` };
}

async function publishBlog(
  item: PublishQueueItem,
): Promise<{ ok: true; ref?: string } | { ok: false; error: string }> {
  const { getClientWpCreds, createWpPost } = await import("./wp-bridge");
  const creds = await getClientWpCreds(item.clientId);
  if (!creds) {
    return {
      ok: false,
      error: "WordPress not connected for this client. Set it up under Settings → WordPress.",
    };
  }
  const payload = (item.payloadJson ?? {}) as {
    metaDescription?: string;
    excerpt?: string;
  };
  // Look up the schedule to decide draft vs publish. If the schedule is
  // gone (orphaned queue item), default to draft — safer.
  let status: "draft" | "publish" = "draft";
  if (item.scheduleId) {
    const [s] = await db
      .select()
      .from(dailySchedules)
      .where(eq(dailySchedules.id, item.scheduleId))
      .limit(1);
    if (s?.autoPublish) status = "publish";
  }
  const r = await createWpPost(creds, {
    title: item.title ?? "Untitled",
    content: item.body ?? "",
    excerpt: payload.excerpt,
    metaDescription: payload.metaDescription,
    status,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ref: r.url };
}

async function publishGbp(
  item: PublishQueueItem,
): Promise<{ ok: true; ref?: string } | { ok: false; error: string }> {
  // Location name comes from the schedule's configJson — set once when
  // the user creates the schedule. Keeps the clients table unchanged
  // (no new column for this v1).
  let locationName: string | null = null;
  if (item.scheduleId) {
    const [s] = await db
      .select()
      .from(dailySchedules)
      .where(eq(dailySchedules.id, item.scheduleId))
      .limit(1);
    const cfg = (s?.configJson ?? {}) as Record<string, unknown>;
    if (typeof cfg.gbp_location_name === "string") {
      locationName = cfg.gbp_location_name;
    }
  }
  if (!locationName) {
    return {
      ok: false,
      error:
        "GBP location not set on the schedule. Edit the schedule and pick a location.",
    };
  }
  const { createGbpLocalPost } = await import("./gbp-api");
  const payload = (item.payloadJson ?? {}) as {
    callToAction?: string | null;
    postType?: string;
  };
  const cta =
    payload.callToAction && payload.callToAction !== ""
      ? {
          actionType: payload.callToAction as
            | "BOOK"
            | "ORDER"
            | "SHOP"
            | "LEARN_MORE"
            | "SIGN_UP"
            | "CALL",
        }
      : undefined;
  const r = await createGbpLocalPost({
    locationName,
    summary: item.body ?? "",
    callToAction: cta,
    clientIdScope: item.clientId,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, ref: r.postName };
}

async function publishChecklist(
  item: PublishQueueItem,
): Promise<{ ok: true; ref?: string } | { ok: false; error: string }> {
  const payload = (item.payloadJson ?? {}) as {
    items?: { title: string; why?: string }[];
  };
  const items = payload.items ?? [];
  if (items.length === 0) {
    return { ok: false, error: "No checklist items in payload." };
  }
  const rows = items.map((i) => ({
    clientId: item.clientId,
    title: i.title.slice(0, 200),
    whyItMatters: (i.why ?? "").slice(0, 500),
    priority: "medium" as const,
    status: "todo" as const,
  }));
  await db.insert(tasks).values(rows);
  return { ok: true, ref: `${items.length} tasks` };
}
