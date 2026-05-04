/**
 * AI meta-rewrite batch. Workflow:
 *
 *   1. Pull a client's GSC page-level performance for last 28 days.
 *   2. Identify "low-CTR opportunities" — pages with high impressions
 *      and below-expected CTR for their position.
 *   3. For each, fetch the current title + meta description from the
 *      live page.
 *   4. Ask the LLM for two improved title + meta options grounded in
 *      the GSC top queries that drove impressions to that page.
 *   5. Return a list ready for the user to review + push to WordPress
 *      via the existing bridge.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { fetchGscPerformance } from "./google-oauth";
import { callAI } from "./ai-call";

const USER_AGENT =
  "Mozilla/5.0 (compatible; SeoToolBot/1.0; +https://example.com/bot)";

export type MetaCandidate = {
  url: string;
  /** Current values pulled from the live page. */
  currentTitle: string;
  currentMeta: string;
  /** GSC stats for the page. */
  clicks: number;
  impressions: number;
  ctrPct: number;
  position: number;
  /** Top queries driving impressions to this page (used to inform the rewrite). */
  topQueries: string[];
  /** Two AI-suggested rewrites. Caller picks which to apply. */
  suggestions: {
    title: string;
    meta: string;
    rationale: string;
  }[];
};

export type BatchResult = {
  total: number;
  candidates: MetaCandidate[];
  error?: string;
};

/**
 * Expected CTR by position for a "normal" SERP. Used to flag
 * underperforming pages — actual CTR much lower than expected = high
 * value to fix the title/meta.
 */
const EXPECTED_CTR: Record<number, number> = {
  1: 0.32,
  2: 0.18,
  3: 0.11,
  4: 0.078,
  5: 0.056,
  6: 0.043,
  7: 0.034,
  8: 0.027,
  9: 0.022,
  10: 0.018,
};

function expectedCtr(position: number): number {
  const rounded = Math.max(1, Math.round(position));
  if (rounded <= 10) return EXPECTED_CTR[rounded] ?? 0.02;
  if (rounded <= 20) return 0.012;
  return 0.005;
}

export async function findLowCtrCandidates(opts: {
  clientId: number;
  /** Min impressions floor to filter out noise. */
  minImpressions?: number;
  /** Max number of candidates to return. */
  limit?: number;
}): Promise<BatchResult> {
  const minImpressions = opts.minImpressions ?? 200;
  const limit = opts.limit ?? 10;

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, opts.clientId))
    .limit(1);
  if (!client?.gscProperty) {
    return { total: 0, candidates: [], error: "GSC not connected for this client." };
  }

  const cutoff = (n: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };

  // Page-level performance
  let pageRows: Awaited<ReturnType<typeof fetchGscPerformance>>;
  try {
    pageRows = await fetchGscPerformance({
      siteUrl: client.gscProperty,
      startDate: cutoff(30),
      endDate: cutoff(2),
      dimensions: ["page"],
      rowLimit: 500,
      clientIdScope: opts.clientId,
    });
  } catch (err) {
    return { total: 0, candidates: [], error: (err as Error).message };
  }

  const ranked = pageRows
    .map((r) => {
      const url = r.keys[0] ?? "";
      const ctr = r.ctr;
      const expected = expectedCtr(r.position);
      const ctrGap = Math.max(0, expected - ctr);
      // Score the opportunity: a page with 500 imp at pos 6 (expected 4.3%
      // CTR) but actual 1% has a much bigger lift potential than a page
      // with 60 imp at pos 30.
      const score = ctrGap * r.impressions;
      return { ...r, url, ctr, ctrGap, score };
    })
    .filter(
      (r) =>
        r.url &&
        /^https?:\/\//.test(r.url) &&
        r.impressions >= minImpressions &&
        r.position <= 30 &&
        r.ctrGap > 0,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (ranked.length === 0) {
    return {
      total: 0,
      candidates: [],
      error: "No low-CTR opportunities found above the impression floor.",
    };
  }

  // Pull queries by page (one extra GSC call) — gives us context for the
  // rewrite. We fetch with both dimensions and group post-hoc.
  let queryRows: Awaited<ReturnType<typeof fetchGscPerformance>> = [];
  try {
    queryRows = await fetchGscPerformance({
      siteUrl: client.gscProperty,
      startDate: cutoff(30),
      endDate: cutoff(2),
      dimensions: ["page", "query"],
      rowLimit: 5000,
      clientIdScope: opts.clientId,
    });
  } catch {
    queryRows = [];
  }
  const queriesByPage = new Map<string, string[]>();
  for (const r of queryRows) {
    const page = r.keys[0] ?? "";
    const query = r.keys[1] ?? "";
    if (!page || !query) continue;
    const list = queriesByPage.get(page) ?? [];
    if (list.length < 5) list.push(query);
    queriesByPage.set(page, list);
  }

  // For each page, fetch current title + meta + AI rewrite (in parallel
  // batches of 3 to keep memory + API cost down)
  const candidates: MetaCandidate[] = [];
  for (let i = 0; i < ranked.length; i += 3) {
    const batch = ranked.slice(i, i + 3);
    const results = await Promise.allSettled(
      batch.map(async (r) => {
        const meta = await fetchCurrentMeta(r.url);
        const topQueries = queriesByPage.get(r.url) ?? [];
        const suggestions = await aiRewrite({
          url: r.url,
          currentTitle: meta.title,
          currentMeta: meta.description,
          topQueries,
          position: r.position,
          impressions: r.impressions,
          ctrPct: r.ctr * 100,
          clientId: opts.clientId,
        });
        return {
          url: r.url,
          currentTitle: meta.title,
          currentMeta: meta.description,
          clicks: r.clicks,
          impressions: r.impressions,
          ctrPct: Number((r.ctr * 100).toFixed(2)),
          position: Number(r.position.toFixed(1)),
          topQueries,
          suggestions,
        };
      }),
    );
    for (const res of results) {
      if (res.status === "fulfilled") candidates.push(res.value);
    }
  }

  return { total: candidates.length, candidates };
}

async function fetchCurrentMeta(
  url: string,
): Promise<{ title: string; description: string }> {
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 10_000);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      signal: ac.signal,
      redirect: "follow",
    });
    if (!res.ok) return { title: "", description: "" };
    const html = (await res.text()).slice(0, 200_000);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    );
    return {
      title: cleanText(titleMatch?.[1] ?? "").slice(0, 200),
      description: cleanText(descMatch?.[1] ?? "").slice(0, 300),
    };
  } catch {
    return { title: "", description: "" };
  } finally {
    clearTimeout(timeout);
  }
}

const SYSTEM_PROMPT = `You are a senior SEO copywriter. The user has a page that gets impressions but few clicks. Rewrite the title + meta description so they're more clickable, while staying truthful and matching search intent for the queries below.

Output STRICT JSON with this shape:
{"suggestions":[
  {"title":"…","meta":"…","rationale":"…"},
  {"title":"…","meta":"…","rationale":"…"}
]}

Rules:
- Exactly 2 suggestions, varied in angle (e.g., one factual + one curiosity-led).
- Title: 50-60 characters. Front-load the keyword. Include the brand suffix only if natural. Use sentence case unless the existing title uses Title Case.
- Meta description: 140-160 characters. Lead with a benefit. Include a soft CTA where it fits.
- rationale: ≤25 words on what changed and why it should improve CTR.
- Don't make claims the user didn't already make. No exaggerations.
- Output ONLY the JSON. No preamble.`;

async function aiRewrite(opts: {
  url: string;
  currentTitle: string;
  currentMeta: string;
  topQueries: string[];
  position: number;
  impressions: number;
  ctrPct: number;
  clientId: number;
}): Promise<MetaCandidate["suggestions"]> {
  const userPrompt = [
    `URL: ${opts.url}`,
    `Current title: ${opts.currentTitle || "(empty)"}`,
    `Current meta description: ${opts.currentMeta || "(empty)"}`,
    `Avg position: ${opts.position.toFixed(1)} · ${opts.impressions} impressions · CTR ${opts.ctrPct.toFixed(2)}%`,
    `Top queries driving impressions:`,
    ...opts.topQueries.map((q) => `  - ${q}`),
    "",
    "Rewrite the title + meta description. Return the JSON object now.",
  ].join("\n");

  const raw = await callAI({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 600,
    temperature: 0.55,
    timeoutMs: 25_000,
    feature: "meta_rewrite",
    clientId: opts.clientId,
  });
  if (!raw) return [];

  try {
    const json = JSON.parse(extractJsonObject(raw)) as {
      suggestions?: { title?: unknown; meta?: unknown; rationale?: unknown }[];
    };
    return (json.suggestions ?? [])
      .map((s) => ({
        title: String(s.title ?? "").trim(),
        meta: String(s.meta ?? "").trim(),
        rationale: String(s.rationale ?? "").trim(),
      }))
      .filter((s) => s.title.length >= 8 && s.meta.length >= 30);
  } catch {
    return [];
  }
}

function cleanText(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonObject(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return "{}";
}
