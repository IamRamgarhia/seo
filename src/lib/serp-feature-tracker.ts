/**
 * SERP-feature tracker. Runs the existing SERP scanner for one or many
 * tracked keywords and stores a snapshot per run, capturing:
 *
 *   - Our position (or null if not in top 10)
 *   - Whether the SERP has an AI Overview, and whether we're cited in it
 *   - Whether there's a featured snippet, and whether we own it
 *   - PAA questions on the SERP
 *   - The top 10 organic results (for SoV calculations)
 *
 * Powers Featured Snippet Hunter, PAA Tracker, and AIO presence over time.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { serpFeatureSnapshots, type NewSerpFeatureSnapshot } from "@/db/schema";
import { scanSerp } from "./serp-scanner";

function normalizeDomain(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

export async function captureSerpSnapshot(opts: {
  query: string;
  country?: string;
  ourDomain?: string;
  keywordId?: number;
}): Promise<{ ok: boolean; snapshotId?: number; error?: string }> {
  const country = (opts.country ?? "US").toUpperCase();
  const ourDomain = normalizeDomain(opts.ourDomain);

  const serp = await scanSerp({
    query: opts.query,
    country,
    clientDomain: opts.ourDomain,
  });

  if (!serp.ok) {
    return { ok: false, error: serp.error ?? "SERP scan failed" };
  }

  const ourResult = serp.topResults.find((r) => r.isClient);
  const featuredOwnedByUs =
    !!serp.featuredSnippet &&
    !!ourDomain &&
    normalizeDomain(serp.featuredSnippet.url) === ourDomain;
  const aioIncludesUs =
    !!ourDomain && serp.aiOverviewSources.includes(ourDomain);

  const row: NewSerpFeatureSnapshot = {
    keywordId: opts.keywordId ?? null,
    query: opts.query,
    country,
    ourDomain: ourDomain || null,
    ourPosition: ourResult?.position ?? null,
    ourUrl: ourResult?.url ?? null,
    hasAio: serp.aiOverviewPresent,
    aioSources: serp.aiOverviewSources,
    aioIncludesUs,
    hasFeaturedSnippet: !!serp.featuredSnippet,
    featuredUrl: serp.featuredSnippet?.url ?? null,
    featuredOwnedByUs,
    paaQuestions: serp.paaQuestions,
    topResults: serp.topResults.map((r) => ({
      position: r.position,
      title: r.title,
      url: r.url,
      domain: r.domain,
    })),
  };

  const [inserted] = await db
    .insert(serpFeatureSnapshots)
    .values(row)
    .returning();

  return { ok: true, snapshotId: inserted?.id };
}

/**
 * Find queries where the user ranks in positions 2-5 and a competitor owns
 * a featured snippet. These are the "low-hanging" snippet-takeover targets.
 */
export async function findFeaturedSnippetOpportunities(opts: {
  ourDomain: string;
}): Promise<
  {
    query: string;
    ourPosition: number;
    competitorUrl: string;
    competitorDomain: string;
    capturedAt: Date;
  }[]
> {
  const ourDomain = normalizeDomain(opts.ourDomain);
  if (!ourDomain) return [];

  // Latest snapshot per query
  const all = await db
    .select()
    .from(serpFeatureSnapshots)
    .orderBy(serpFeatureSnapshots.capturedAt);
  const latest = new Map<string, (typeof all)[number]>();
  for (const s of all) {
    const k = `${s.query}|${s.country}`;
    latest.set(k, s);
  }

  const out: {
    query: string;
    ourPosition: number;
    competitorUrl: string;
    competitorDomain: string;
    capturedAt: Date;
  }[] = [];
  for (const s of latest.values()) {
    if (
      s.hasFeaturedSnippet &&
      !s.featuredOwnedByUs &&
      s.ourPosition !== null &&
      s.ourPosition <= 5 &&
      s.featuredUrl
    ) {
      out.push({
        query: s.query,
        ourPosition: s.ourPosition,
        competitorUrl: s.featuredUrl,
        competitorDomain: normalizeDomain(s.featuredUrl),
        capturedAt: s.capturedAt,
      });
    }
  }
  return out.sort((a, b) => a.ourPosition - b.ourPosition);
}

/**
 * Aggregate AIO + PAA presence across all snapshots for a dashboard view.
 */
export async function summarizeSerpFeatures(): Promise<{
  total: number;
  withAio: number;
  withFeatured: number;
  citedInAio: number;
  ownFeatured: number;
  paaTotal: number;
  /** Latest snapshot per query, sorted by capture time. */
  latest: {
    query: string;
    country: string;
    hasAio: boolean;
    aioIncludesUs: boolean;
    hasFeaturedSnippet: boolean;
    featuredOwnedByUs: boolean;
    ourPosition: number | null;
    paaQuestions: string[];
    capturedAt: Date;
  }[];
}> {
  const all = await db
    .select()
    .from(serpFeatureSnapshots)
    .orderBy(serpFeatureSnapshots.capturedAt);
  const latest = new Map<string, (typeof all)[number]>();
  for (const s of all) {
    const k = `${s.query}|${s.country}`;
    latest.set(k, s);
  }

  let withAio = 0,
    withFeatured = 0,
    citedInAio = 0,
    ownFeatured = 0,
    paaTotal = 0;
  for (const s of latest.values()) {
    if (s.hasAio) withAio += 1;
    if (s.hasFeaturedSnippet) withFeatured += 1;
    if (s.aioIncludesUs) citedInAio += 1;
    if (s.featuredOwnedByUs) ownFeatured += 1;
    paaTotal += (s.paaQuestions ?? []).length;
  }

  return {
    total: latest.size,
    withAio,
    withFeatured,
    citedInAio,
    ownFeatured,
    paaTotal,
    latest: Array.from(latest.values())
      .map((s) => ({
        query: s.query,
        country: s.country,
        hasAio: s.hasAio,
        aioIncludesUs: s.aioIncludesUs,
        hasFeaturedSnippet: s.hasFeaturedSnippet,
        featuredOwnedByUs: s.featuredOwnedByUs,
        ourPosition: s.ourPosition,
        paaQuestions: s.paaQuestions ?? [],
        capturedAt: s.capturedAt,
      }))
      .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())
      .slice(0, 100),
  };
}

export async function listAllPaaQuestions(): Promise<
  { question: string; firstSeenIn: string; count: number }[]
> {
  const all = await db.select().from(serpFeatureSnapshots);
  const counts = new Map<string, { firstSeenIn: string; count: number }>();
  for (const s of all) {
    for (const q of s.paaQuestions ?? []) {
      const cur = counts.get(q) ?? { firstSeenIn: s.query, count: 0 };
      cur.count += 1;
      counts.set(q, cur);
    }
  }
  return Array.from(counts.entries())
    .map(([question, v]) => ({ question, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);
}

export async function deleteSnapshot(id: number) {
  await db.delete(serpFeatureSnapshots).where(eq(serpFeatureSnapshots.id, id));
}
