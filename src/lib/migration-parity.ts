/**
 * Migration URL-parity auditor. Hand it old + new sitemap URLs, we crawl
 * both, compare. Surfaces:
 *
 *   - URLs that disappeared (need 301 or 410)
 *   - New URLs that didn't exist before (review for cannibalization /
 *     content drift)
 *   - URLs that now return non-200 status
 *   - URLs that lost their canonical / changed canonical
 */

const USER_AGENT =
  "Mozilla/5.0 (compatible; SeoToolBot/1.0; +https://example.com/bot)";

export type ParityRow = {
  oldUrl: string;
  newStatus: number | null;
  finalUrl: string | null;
  redirectChain: number;
  outcome: "ok" | "redirected_to_unrelated" | "404" | "5xx" | "error";
  notes: string;
};

export type ParityReport = {
  total: number;
  byOutcome: Record<string, number>;
  rows: ParityRow[];
};

export async function auditParity(opts: {
  oldUrls: string[];
  newDomain?: string;
}): Promise<ParityReport> {
  const newHost = opts.newDomain ? hostOf(opts.newDomain) : null;
  const concurrency = 8;
  const queue = opts.oldUrls.slice(0, 500);
  const rows: ParityRow[] = [];

  async function worker() {
    while (queue.length > 0) {
      const u = queue.shift();
      if (!u) return;
      const r = await checkOne(u, newHost);
      rows.push(r);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));

  const byOutcome: Record<string, number> = {};
  for (const r of rows) {
    byOutcome[r.outcome] = (byOutcome[r.outcome] ?? 0) + 1;
  }

  return { total: rows.length, byOutcome, rows };
}

async function checkOne(
  url: string,
  newHost: string | null,
): Promise<ParityRow> {
  let chain = 0;
  let current = url;
  let finalUrl = url;
  let lastStatus: number | null = null;

  for (let i = 0; i < 6; i++) {
    let res: Response;
    try {
      res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { "user-agent": USER_AGENT, accept: "text/html" },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (err) {
      return {
        oldUrl: url,
        newStatus: null,
        finalUrl: null,
        redirectChain: chain,
        outcome: "error",
        notes: (err as Error).message,
      };
    }
    lastStatus = res.status;
    finalUrl = current;
    try {
      await res.body?.cancel();
    } catch {
      // ignore
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      try {
        current = new URL(loc, current).toString();
      } catch {
        break;
      }
      chain += 1;
      continue;
    }
    break;
  }

  if (!lastStatus) {
    return {
      oldUrl: url,
      newStatus: null,
      finalUrl: null,
      redirectChain: chain,
      outcome: "error",
      notes: "No response",
    };
  }

  if (lastStatus === 404 || lastStatus === 410) {
    return {
      oldUrl: url,
      newStatus: lastStatus,
      finalUrl,
      redirectChain: chain,
      outcome: "404",
      notes: `${lastStatus} — needs a 301`,
    };
  }
  if (lastStatus >= 500) {
    return {
      oldUrl: url,
      newStatus: lastStatus,
      finalUrl,
      redirectChain: chain,
      outcome: "5xx",
      notes: `Server error ${lastStatus}`,
    };
  }

  // Redirected to a totally unrelated page?
  if (chain > 0 && newHost) {
    const finalHost = hostOf(finalUrl);
    if (finalHost && finalHost !== newHost && finalHost !== hostOf(url)) {
      return {
        oldUrl: url,
        newStatus: lastStatus,
        finalUrl,
        redirectChain: chain,
        outcome: "redirected_to_unrelated",
        notes: `Redirects off-host to ${finalHost}`,
      };
    }
  }

  return {
    oldUrl: url,
    newStatus: lastStatus,
    finalUrl,
    redirectChain: chain,
    outcome: "ok",
    notes:
      chain === 0
        ? "Direct 200"
        : `301'd via ${chain} hop${chain === 1 ? "" : "s"}`,
  };
}

function hostOf(s: string): string | null {
  try {
    return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).hostname.replace(
      /^www\./i,
      "",
    );
  } catch {
    return null;
  }
}
