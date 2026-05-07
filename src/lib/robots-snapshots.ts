/**
 * Robots.txt snapshot + diff. Hand it a hostname, we fetch /robots.txt,
 * hash the body, store if changed. List endpoint returns the timeline of
 * changes with simple line-level diff.
 */

import crypto from "node:crypto";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { robotsSnapshots, type RobotsSnapshot } from "@/db/schema";

const USER_AGENT =
  "Mozilla/5.0 (compatible; SeoToolBot/1.0; +https://example.com/bot)";

export async function snapshotRobots(rawHost: string): Promise<{
  ok: boolean;
  changed: boolean;
  snapshot: RobotsSnapshot | null;
  error?: string;
}> {
  const hostname = parseHost(rawHost);
  if (!hostname) return { ok: false, changed: false, snapshot: null, error: "Invalid host" };

  const url = `https://${hostname}/robots.txt`;
  let content = "";
  let status = 0;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/plain" },
      signal: AbortSignal.timeout(10_000),
    });
    status = res.status;
    if (res.ok) {
      content = (await res.text()).slice(0, 200_000);
    } else {
      content = `# HTTP ${res.status} returned by ${url}`;
    }
  } catch (err) {
    return {
      ok: false,
      changed: false,
      snapshot: null,
      error: (err as Error).message,
    };
  }

  const hash = crypto.createHash("sha256").update(content).digest("hex");

  // Check most recent for this host
  const [latest] = await db
    .select()
    .from(robotsSnapshots)
    .where(eq(robotsSnapshots.hostname, hostname))
    .orderBy(desc(robotsSnapshots.fetchedAt))
    .limit(1);

  if (latest && latest.contentHash === hash) {
    return { ok: true, changed: false, snapshot: latest };
  }

  const [inserted] = await db
    .insert(robotsSnapshots)
    .values({
      hostname,
      content,
      contentHash: hash,
      status,
    })
    .returning();

  return { ok: true, changed: true, snapshot: inserted ?? null };
}

export async function listSnapshots(hostname: string, limit = 20): Promise<RobotsSnapshot[]> {
  const h = parseHost(hostname);
  if (!h) return [];
  return db
    .select()
    .from(robotsSnapshots)
    .where(eq(robotsSnapshots.hostname, h))
    .orderBy(desc(robotsSnapshots.fetchedAt))
    .limit(limit);
}

export async function listAllHosts(): Promise<{ hostname: string; lastFetched: Date; snapshots: number }[]> {
  const all = await db
    .select()
    .from(robotsSnapshots)
    .orderBy(desc(robotsSnapshots.fetchedAt));
  const grouped = new Map<string, { lastFetched: Date; count: number }>();
  for (const s of all) {
    const cur = grouped.get(s.hostname) ?? { lastFetched: s.fetchedAt, count: 0 };
    if (s.fetchedAt > cur.lastFetched) cur.lastFetched = s.fetchedAt;
    cur.count += 1;
    grouped.set(s.hostname, cur);
  }
  return Array.from(grouped.entries())
    .map(([hostname, v]) => ({ hostname, lastFetched: v.lastFetched, snapshots: v.count }))
    .sort((a, b) => b.lastFetched.getTime() - a.lastFetched.getTime());
}

// diffSnapshots / DiffLine moved to ./diff-text so client components can use them
export { diffSnapshots, type DiffLine } from "./diff-text";

function parseHost(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    return new URL(s).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}
