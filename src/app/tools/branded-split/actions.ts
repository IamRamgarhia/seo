"use server";

import { fetchGscPerformance } from "@/lib/google-oauth";

export type BrandedRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  branded: boolean;
};

export type BrandedSplitState =
  | {
      ok: true;
      rows: BrandedRow[];
      summary: {
        brandedClicks: number;
        nonBrandedClicks: number;
        brandedImpressions: number;
        nonBrandedImpressions: number;
        brandedQueries: number;
        nonBrandedQueries: number;
      };
      delta: {
        brandedDelta: number;
        nonBrandedDelta: number;
        prevBrandedClicks: number;
        prevNonBrandedClicks: number;
      };
    }
  | { ok: false; error: string };

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function isBranded(query: string, brandTerms: string[]): boolean {
  const q = query.toLowerCase();
  return brandTerms.some((t) => t && q.includes(t));
}

export async function runSplit(
  _prev: BrandedSplitState | null,
  formData: FormData,
): Promise<BrandedSplitState> {
  const site = String(formData.get("site") ?? "").trim();
  const brandRaw = String(formData.get("brandTerms") ?? "").trim();
  if (!site) return { ok: false, error: "Pick a GSC property." };
  if (!brandRaw)
    return { ok: false, error: "Add at least one brand term (comma-separated)." };

  const brandTerms = brandRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  try {
    const [recent, prev] = await Promise.all([
      fetchGscPerformance({
        siteUrl: site,
        startDate: daysAgo(30),
        endDate: daysAgo(2),
        dimensions: ["query"],
        rowLimit: 1000,
      }),
      fetchGscPerformance({
        siteUrl: site,
        startDate: daysAgo(58),
        endDate: daysAgo(31),
        dimensions: ["query"],
        rowLimit: 1000,
      }),
    ]);

    const rows: BrandedRow[] = recent
      .map((r) => ({
        query: r.keys[0] ?? "",
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        branded: isBranded(r.keys[0] ?? "", brandTerms),
      }))
      .filter((r) => r.query)
      .sort((a, b) => b.clicks - a.clicks);

    let brandedClicks = 0,
      nonBrandedClicks = 0,
      brandedImp = 0,
      nonBrandedImp = 0,
      brandedQ = 0,
      nonBrandedQ = 0;
    for (const r of rows) {
      if (r.branded) {
        brandedClicks += r.clicks;
        brandedImp += r.impressions;
        brandedQ += 1;
      } else {
        nonBrandedClicks += r.clicks;
        nonBrandedImp += r.impressions;
        nonBrandedQ += 1;
      }
    }

    let prevBranded = 0,
      prevNonBranded = 0;
    for (const r of prev) {
      const q = r.keys[0] ?? "";
      if (!q) continue;
      if (isBranded(q, brandTerms)) prevBranded += r.clicks;
      else prevNonBranded += r.clicks;
    }

    return {
      ok: true,
      rows,
      summary: {
        brandedClicks,
        nonBrandedClicks,
        brandedImpressions: brandedImp,
        nonBrandedImpressions: nonBrandedImp,
        brandedQueries: brandedQ,
        nonBrandedQueries: nonBrandedQ,
      },
      delta: {
        brandedDelta: brandedClicks - prevBranded,
        nonBrandedDelta: nonBrandedClicks - prevNonBranded,
        prevBrandedClicks: prevBranded,
        prevNonBrandedClicks: prevNonBranded,
      },
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? "GSC fetch failed" };
  }
}
