"use server";

import { callAI } from "@/lib/ai-call";
import { scanCwv } from "@/lib/pagespeed";
import { saveToolRun } from "@/lib/tool-runs";

export type SxoAudit = {
  url: string;
  primaryPersona: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
  pagePromise: { ok: boolean; note: string };
  timeToAnswer: { score: number; note: string };
  nextStep: { ok: boolean; note: string };
  friction: { score: number; items: string[] };
  cwv: { score: number; lcpMs: number | null; cls: number | null };
  /** Composite 0-100. */
  sxoScore: number;
  recommendations: string[];
};

export type SxoState =
  | { ok: true; audit: SxoAudit }
  | { ok: false; error: string }
  | null;

const USER_AGENT =
  "Mozilla/5.0 (compatible; SeoToolBot/0.1; +https://localhost)";

async function fetchHtml(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) return null;
    return (await res.text()).slice(0, 600_000);
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function detectFriction(html: string): string[] {
  const items: string[] = [];
  // Cookie banner
  if (
    /cookie/i.test(html) &&
    /(consent|banner|gdpr|accept[^<]{0,30}(all|cookies))/i.test(html)
  ) {
    items.push("Cookie banner likely covers initial viewport");
  }
  // Pop-up / modal
  if (/<div[^>]*class=["'][^"']*(popup|modal|overlay|lightbox)/i.test(html)) {
    items.push("Pop-up / modal markup present — verify it isn't on initial load");
  }
  // Newsletter signup interstitial
  if (
    /subscribe[^<]{0,30}newsletter|sign up[^<]{0,30}email/i.test(html) &&
    /<form[^>]*>/i.test(html)
  ) {
    items.push("Newsletter signup detected — common dwell-time killer when interstitial");
  }
  // Excessive ad slots
  const adSlots = (html.match(/adsbygoogle|google_ad_|data-ad-slot/g) ?? []).length;
  if (adSlots >= 4) {
    items.push(`${adSlots} ad slots detected — heavy ads correlate with pogo-sticking`);
  }
  // Auto-playing video
  if (/<video[^>]+autoplay/i.test(html)) {
    items.push("Auto-playing video on the page");
  }
  // No clear CTA on the page (no buttons with action-y text)
  const ctas = (
    html.match(
      /<(?:a|button)[^>]*>[^<]*(?:buy|sign\s*up|get started|download|book|contact|try|start|learn more)[^<]*<\/(?:a|button)>/gi,
    ) ?? []
  ).length;
  if (ctas === 0) {
    items.push("No clear action button detected — users have no obvious next step");
  }
  return items;
}

function detectIntent(
  url: string,
  html: string,
): "informational" | "commercial" | "transactional" | "navigational" {
  const u = url.toLowerCase();
  if (
    u.includes("/buy") ||
    u.includes("/checkout") ||
    u.includes("/cart") ||
    u.includes("/order")
  )
    return "transactional";
  if (
    u.includes("/pricing") ||
    u.includes("/plans") ||
    u.includes("/compare") ||
    u.includes("/vs") ||
    u.includes("/alternative")
  )
    return "commercial";
  if (
    u.includes("/login") ||
    u.includes("/sign-in") ||
    u.includes("/contact") ||
    u.includes("/about")
  )
    return "navigational";
  if (
    u.includes("/blog/") ||
    u.includes("/guide") ||
    u.includes("/learn") ||
    u.includes("/how-to") ||
    u.includes("/what-is")
  )
    return "informational";
  // Look at content
  if (/(?:add to cart|buy now|checkout|book now)/i.test(html)) return "transactional";
  if (/(?:pricing|plans|free trial|start trial)/i.test(html)) return "commercial";
  return "informational";
}

function detectFirstParagraphLength(html: string): number {
  // Strip head & nav before measuring "above-the-fold" content density
  const body =
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
    html;
  const firstPara = body.match(
    /<(?:p|h2|h1)[^>]*>([\s\S]{20,600}?)<\/(?:p|h2|h1)>/i,
  )?.[1];
  if (!firstPara) return 0;
  return firstPara.replace(/<[^>]+>/g, "").trim().length;
}

export async function runSxoAudit(
  _prev: SxoState,
  formData: FormData,
): Promise<SxoState> {
  const urlRaw = String(formData.get("url") ?? "").trim();
  if (!urlRaw) return { ok: false, error: "URL required." };
  let url: string;
  try {
    url = new URL(/^https?:\/\//i.test(urlRaw) ? urlRaw : `https://${urlRaw}`)
      .toString();
  } catch {
    return { ok: false, error: "Invalid URL." };
  }
  const html = await fetchHtml(url);
  if (!html) return { ok: false, error: `Couldn't fetch ${url}` };

  const intent = detectIntent(url, html);

  // Page promise: H1 + first paragraph cohesion
  const h1 = html.match(/<h1[^>]*>([\s\S]{2,200}?)<\/h1>/i)?.[1] ?? "";
  const h1Text = h1.replace(/<[^>]+>/g, "").trim();
  const firstParaLen = detectFirstParagraphLength(html);
  const pagePromise = {
    ok: !!h1Text && firstParaLen >= 60,
    note: h1Text
      ? `H1: "${h1Text.slice(0, 80)}". First content block: ${firstParaLen} chars.`
      : "No H1 — page promise unclear.",
  };

  // Time-to-answer — look for TL;DR / summary / definition opener
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const opensWithDef = /^[^.]{20,200}\b(is|are|means|measures)\b/i.test(
    stripped.slice(0, 500),
  );
  const hasTldr = /tl;?dr|in short|summary[:\s]|key takeaway/i.test(
    stripped.slice(0, 1500),
  );
  let ttaScore = 40;
  if (opensWithDef) ttaScore += 30;
  if (hasTldr) ttaScore += 30;
  const timeToAnswer = {
    score: Math.min(100, ttaScore),
    note: `${opensWithDef ? "Opens with a direct definition. " : "Doesn't open with a direct answer. "}${hasTldr ? "Has TL;DR / summary." : "No TL;DR found."}`,
  };

  // Next step
  const ctaCount = (
    html.match(
      /<(?:a|button)[^>]*>[^<]*(?:buy|sign\s*up|get started|download|book|contact|try|start|learn more|read more|explore|browse|shop|order)[^<]*<\/(?:a|button)>/gi,
    ) ?? []
  ).length;
  const nextStep = {
    ok: ctaCount >= 1,
    note: ctaCount > 0
      ? `${ctaCount} action-oriented CTAs detected.`
      : "No clear CTA — dead-end page risk.",
  };

  // Friction
  const frictionItems = detectFriction(html);
  const frictionScore = Math.max(0, 100 - frictionItems.length * 15);

  // CWV (PSI lab score)
  let cwvScore = 50;
  let lcpMs: number | null = null;
  let cls: number | null = null;
  try {
    const cwv = await scanCwv({ url });
    if (cwv.ok) {
      cwvScore = cwv.performance ?? 50;
      lcpMs = cwv.lcpMs;
      cls = cwv.cls !== null ? cwv.cls / 100 : null;
    }
  } catch {
    // fallback
  }

  // AI step — derive primary persona + recommendations
  const aiPrompt = `Page: ${url}
Intent: ${intent}
H1: ${h1Text}
First content opens with definition: ${opensWithDef ? "yes" : "no"}
CTA buttons: ${ctaCount}
Friction items: ${frictionItems.join("; ") || "none"}
PSI performance: ${cwvScore}/100

Output a JSON object with: { "primaryPersona": "<one phrase>", "recommendations": ["<specific fix>", ...] }. 3-5 recommendations, each <120 chars. Prioritize SXO (search experience optimization) actions: opening clarity, removing friction, sharpening next step, satisfying intent.`;

  let primaryPersona = "Default persona — couldn't infer.";
  let recommendations: string[] = [
    "Open the page with a direct definition or value statement.",
    "Ensure at least one prominent CTA is visible in the first viewport.",
    "Remove or delay non-essential interstitials (cookies, popups).",
  ];
  const aiText = await callAI({
    system:
      "You are an SXO (Search Experience Optimization) consultant. Return only JSON.",
    user: aiPrompt,
    maxTokens: 600,
    temperature: 0.3,
    feature: "general",
  });
  if (aiText) {
    const m = aiText.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const j = JSON.parse(m[0]) as {
          primaryPersona?: string;
          recommendations?: string[];
        };
        if (j.primaryPersona) primaryPersona = j.primaryPersona;
        if (Array.isArray(j.recommendations) && j.recommendations.length > 0) {
          recommendations = j.recommendations
            .map((r) => String(r).slice(0, 200))
            .slice(0, 6);
        }
      } catch {
        // ignore
      }
    }
  }

  // SXO composite
  const sxoScore = Math.round(
    (pagePromise.ok ? 100 : 30) * 0.2 +
      timeToAnswer.score * 0.2 +
      (nextStep.ok ? 100 : 20) * 0.2 +
      frictionScore * 0.2 +
      cwvScore * 0.2,
  );

  const audit: SxoAudit = {
    url,
    primaryPersona,
    intent,
    pagePromise,
    timeToAnswer,
    nextStep,
    friction: { score: frictionScore, items: frictionItems },
    cwv: { score: cwvScore, lcpMs, cls },
    sxoScore,
    recommendations,
  };
  await saveToolRun({
    toolId: "sxo",
    label: `${url} · SXO ${sxoScore}/100`,
    input: { url },
    result: { ok: true, audit },
  }).catch(() => undefined);
  return { ok: true, audit };
}
