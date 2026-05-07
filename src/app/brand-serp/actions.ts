"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clients, type ClientSocialLinks } from "@/db/schema";
import { scanSerp } from "@/lib/serp-scanner";

export type BrandSerpResult = {
  ok: boolean;
  brand: string;
  results: {
    position: number;
    title: string;
    url: string;
    domain: string;
    isOwned: "domain" | "social" | "knowledge" | "third-party";
  }[];
  ownership: {
    owned: number;
    thirdParty: number;
    total: number;
    pct: number;
  };
  error?: string;
};

export async function captureBrandSerp(
  clientId: number,
): Promise<BrandSerpResult> {
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) return empty("(no client)", "Client not found");

  const brand = client.name;
  const ownDomain = (() => {
    try {
      return new URL(client.url).hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
      return "";
    }
  })();
  const socialDomains = collectSocialDomains(client.socialLinks ?? null);

  try {
    const serp = await scanSerp({ query: brand, country: client.country ?? "US" });
    if (!serp.ok) return empty(brand, serp.error ?? "SERP scan failed");

    const results = serp.topResults.map((r) => {
      let isOwned: "domain" | "social" | "knowledge" | "third-party" = "third-party";
      const d = r.domain.replace(/^www\./i, "").toLowerCase();
      if (ownDomain && (d === ownDomain || d.endsWith(`.${ownDomain}`)))
        isOwned = "domain";
      else if (socialDomains.has(d)) isOwned = "social";
      else if (
        /wikipedia\.org|wikidata\.org|crunchbase\.com|bloomberg\.com\/profile|linkedin\.com\/company/i.test(
          r.url,
        )
      )
        isOwned = "knowledge";
      return { ...r, isOwned };
    });

    const owned = results.filter((r) => r.isOwned !== "third-party").length;
    const total = results.length;

    return {
      ok: true,
      brand,
      results,
      ownership: {
        owned,
        thirdParty: total - owned,
        total,
        pct: total > 0 ? (owned / total) * 100 : 0,
      },
    };
  } catch (err) {
    return empty(brand, (err as Error).message);
  }
}

function collectSocialDomains(links: ClientSocialLinks | null): Set<string> {
  const set = new Set<string>();
  if (!links) return set;
  const sources: (string | undefined)[] = [
    links.facebook,
    links.twitter,
    links.instagram,
    links.linkedin,
    links.youtube,
    links.tiktok,
    links.pinterest,
    links.github,
  ];
  for (const url of sources) {
    if (!url) continue;
    try {
      const u = new URL(url);
      set.add(u.hostname.replace(/^www\./i, "").toLowerCase());
    } catch {
      // ignore
    }
  }
  // Common social domains the user might not have linked but still owns
  // when they have any of those handles
  return set;
}

function empty(brand: string, error: string): BrandSerpResult {
  return {
    ok: false,
    brand,
    results: [],
    ownership: { owned: 0, thirdParty: 0, total: 0, pct: 0 },
    error,
  };
}
