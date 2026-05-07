/**
 * Bulk blog planner.
 *
 * Two-step pipeline:
 *
 *   1) `analyzeSiteForBlogContext(url)` — fetch the homepage, distill what
 *      the site is about (topic, audience, tone, products/services). This
 *      becomes the seed for every topic suggestion.
 *
 *   2) `suggestBulkBlogTopics(ctx, count)` — ask the AI for `count` topic
 *      ideas tuned to the site context. Each idea returns:
 *        - title (editable by the user before drafting)
 *        - targetKeyword (used to constrain the eventual draft)
 *        - searchIntent (info / nav / commercial / transactional)
 *        - rationale (why this topic fits the site + has SEO upside)
 *        - suggestedAngle (a unique hook so the post isn't generic)
 *        - estimatedWordCount (how long the eventual draft should be)
 *
 * The actual full-draft generation reuses `lib/blog-writer.ts` so the
 * post style stays consistent with single-post writing.
 */

import { callAI } from "./ai-call";

const USER_AGENT =
  "Mozilla/5.0 (compatible; seo-tool/1.0; +https://example.com)";

export type SiteBlogContext = {
  url: string;
  domain: string;
  detectedTitle: string;
  detectedDescription: string;
  /** Two-line plain-English summary of what this site does. */
  summary: string;
  /** Inferred audience persona (e.g. "small business owners"). */
  audience: string;
  /** Inferred topic clusters the site already covers. */
  existingTopics: string[];
  /** Tone descriptor (e.g. "professional, warm"). */
  tone: string;
  /** Products / services / categories the site sells or offers. */
  offerings: string[];
};

export type BulkBlogTopic = {
  title: string;
  targetKeyword: string;
  searchIntent: "informational" | "navigational" | "commercial" | "transactional";
  rationale: string;
  suggestedAngle: string;
  estimatedWordCount: number;
};

async function fetchHomepage(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) return "";
    return (await res.text()).slice(0, 400_000);
  } catch {
    return "";
  } finally {
    clearTimeout(t);
  }
}

function extractMeta(html: string): { title: string; description: string } {
  const title =
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
  const description =
    html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    )?.[1]?.trim() ??
    html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i,
    )?.[1]?.trim() ??
    "";
  return { title: title.slice(0, 200), description: description.slice(0, 400) };
}

function extractNavLinks(html: string): string[] {
  const linkTexts = new Set<string>();
  const re = /<a[^>]*>([^<]{2,40})<\/a>/gi;
  let match;
  while ((match = re.exec(html)) && linkTexts.size < 40) {
    const text = match[1].replace(/\s+/g, " ").trim();
    if (text && !/^(home|login|sign|cart|menu|contact)$/i.test(text)) {
      linkTexts.add(text);
    }
  }
  return Array.from(linkTexts).slice(0, 20);
}

function extractH1H2(html: string): string[] {
  const headings = new Set<string>();
  for (const tag of ["h1", "h2"]) {
    const re = new RegExp(`<${tag}[^>]*>([^<]{3,100})</${tag}>`, "gi");
    let m;
    while ((m = re.exec(html)) && headings.size < 20) {
      headings.add(m[1].replace(/\s+/g, " ").trim());
    }
  }
  return Array.from(headings).slice(0, 12);
}

/**
 * Read the homepage and ask the model to summarize it. Returns a structured
 * context object the topic generator uses as seed.
 */
export async function analyzeSiteForBlogContext(
  url: string,
): Promise<SiteBlogContext | null> {
  if (!url) return null;
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  const html = await fetchHomepage(url);
  if (!html) {
    return {
      url,
      domain,
      detectedTitle: "",
      detectedDescription: "",
      summary: `${domain} (couldn't fetch homepage — describe the site manually).`,
      audience: "general",
      existingTopics: [],
      tone: "professional",
      offerings: [],
    };
  }

  const meta = extractMeta(html);
  const nav = extractNavLinks(html);
  const headings = extractH1H2(html);

  const system = `You analyze a homepage and produce a tight JSON describing the site for blog planning. Output ONLY a JSON object with these fields:
- "summary": 2-line plain-English description of what the site does
- "audience": who reads / buys (one phrase, e.g. "freelance designers", "homeowners in Texas")
- "existingTopics": array of 4-8 topic clusters already covered (lowercase phrases)
- "tone": tone descriptor (e.g. "professional, warm", "irreverent, technical")
- "offerings": array of products / services / categories the site sells

Be specific to THIS site. Don't be generic.`;

  const user = `Domain: ${domain}
Title: ${meta.title}
Meta description: ${meta.description}

Top nav links / link texts:
${nav.join(" · ")}

Top headings on the page:
${headings.join("\n- ")}

Return JSON only.`;

  const text = await callAI({
    system,
    user,
    maxTokens: 600,
    temperature: 0.2,
    feature: "general",
  });

  const fallback: SiteBlogContext = {
    url,
    domain,
    detectedTitle: meta.title,
    detectedDescription: meta.description,
    summary: meta.description || `${domain} — homepage didn't expose enough context.`,
    audience: "general",
    existingTopics: headings.slice(0, 5),
    tone: "professional",
    offerings: [],
  };
  if (!text) return fallback;

  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return fallback;
  try {
    const parsed = JSON.parse(m[0]) as Record<string, unknown>;
    return {
      url,
      domain,
      detectedTitle: meta.title,
      detectedDescription: meta.description,
      summary: String(parsed.summary ?? fallback.summary).slice(0, 500),
      audience: String(parsed.audience ?? fallback.audience).slice(0, 200),
      existingTopics: Array.isArray(parsed.existingTopics)
        ? parsed.existingTopics.slice(0, 12).map((s) => String(s).slice(0, 80))
        : fallback.existingTopics,
      tone: String(parsed.tone ?? fallback.tone).slice(0, 100),
      offerings: Array.isArray(parsed.offerings)
        ? parsed.offerings.slice(0, 12).map((s) => String(s).slice(0, 100))
        : fallback.offerings,
    };
  } catch {
    return fallback;
  }
}

/**
 * Generate `count` blog topic ideas tuned to a site context. We instruct the
 * model to spread search intents (don't return 12 informational), avoid
 * topics the site already covers, and weight toward topics with realistic
 * SEO upside.
 */
export async function suggestBulkBlogTopics(
  ctx: SiteBlogContext,
  count: number,
  extraHints?: string,
): Promise<BulkBlogTopic[]> {
  const safeCount = Math.max(1, Math.min(20, Math.round(count)));

  const system = `You're an SEO content strategist generating a blog plan. Output ONLY a JSON array of ${safeCount} topic ideas. Each item has:
- "title" (the suggested H1, max 70 chars, specific, click-worthy without click-bait)
- "targetKeyword" (a single phrase the post should rank for, lowercase)
- "searchIntent" (one of: "informational" | "navigational" | "commercial" | "transactional")
- "rationale" (why THIS site should write this — 1 sentence)
- "suggestedAngle" (a unique hook / framing so the post isn't generic — 1 sentence)
- "estimatedWordCount" (number — 800, 1200, 1500, or 2000)

Rules:
- Don't repeat topics the site already covers.
- Spread search intents — at least 2 commercial/transactional ideas if the site sells something.
- For local sites, weight toward "[topic] in [city]" or "[topic] near me" patterns.
- For SaaS / B2B, mix comparison posts, integration posts, and use-case posts.
- For e-commerce, mix buyer-guide, comparison, and how-to-use content.
- For service sites, mix problem-aware (informational) with bottom-funnel ("why hire X").`;

  const user = `Site context:
- Domain: ${ctx.domain}
- What it does: ${ctx.summary}
- Audience: ${ctx.audience}
- Tone: ${ctx.tone}
- Existing topics: ${ctx.existingTopics.join(", ") || "(none captured)"}
- Offerings / products: ${ctx.offerings.join(", ") || "(none captured)"}

${extraHints ? `Extra hints from the user:\n${extraHints}\n` : ""}

Return ONLY the JSON array of ${safeCount} ideas.`;

  const text = await callAI({
    system,
    user,
    maxTokens: Math.min(4000, safeCount * 200 + 400),
    temperature: 0.6,
    feature: "content_idea",
    timeoutMs: 90_000,
  });
  if (!text) return [];

  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const parsed = JSON.parse(m[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p): p is BulkBlogTopic => {
        if (!p || typeof p !== "object") return false;
        const o = p as Record<string, unknown>;
        return (
          typeof o.title === "string" && typeof o.targetKeyword === "string"
        );
      })
      .slice(0, safeCount)
      .map((p) => ({
        title: String(p.title).slice(0, 200),
        targetKeyword: String(p.targetKeyword).slice(0, 120),
        searchIntent:
          (p.searchIntent as BulkBlogTopic["searchIntent"]) ?? "informational",
        rationale: String(p.rationale ?? "").slice(0, 300),
        suggestedAngle: String(p.suggestedAngle ?? "").slice(0, 300),
        estimatedWordCount:
          typeof p.estimatedWordCount === "number"
            ? Math.max(500, Math.min(3000, Math.round(p.estimatedWordCount)))
            : 1200,
      }));
  } catch {
    return [];
  }
}

/**
 * Refine a single user-typed title into 3 stronger AI-suggested variations.
 * Used in the bulk wizard when the user types their own title and wants
 * "make this better" suggestions.
 */
export async function refineTitle(
  ctx: SiteBlogContext,
  rawTitle: string,
  targetKeyword: string,
): Promise<string[]> {
  if (!rawTitle.trim()) return [];
  const system = `Rewrite a blog title in 3 stronger ways for SEO and click-through. Output ONLY a JSON array of 3 strings. Each:
- Under 70 characters
- Include the target keyword naturally if possible
- No clickbait, no ALL CAPS, no question form unless the original was a question`;

  const user = `Site: ${ctx.domain} — ${ctx.summary}
Audience: ${ctx.audience}
Target keyword: ${targetKeyword}
Original title: ${rawTitle}

Return ONLY the JSON array of 3 alternatives.`;

  const text = await callAI({
    system,
    user,
    maxTokens: 400,
    temperature: 0.6,
    feature: "title_rewrite",
  });
  if (!text) return [];
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 3).map((s) => String(s).slice(0, 200));
  } catch {
    return [];
  }
}
