/**
 * Generic JS-rendered capture. Hand it a URL and it returns:
 *   - rendered HTML (post-hydration, what users + Googlebot actually see)
 *   - full-page screenshot as a base64 data URL
 *   - HTTP status, redirect chain, final URL
 *   - response headers
 *   - console errors / warnings
 *   - failed network requests
 *   - rendered <title>, meta description, h1, count of links / images / scripts
 *
 * The motivating use cases:
 *   - SPA / JS-heavy sites where curl-style fetch shows an empty shell
 *   - Quick visual diff against what a client thinks the page looks like
 *   - Confirming a redirect chain ends where you expect
 *   - Capturing a SERP screenshot for the rank-tracker history
 */

import { withBrowserContext } from "./browser-pool";

export type RenderResult = {
  ok: boolean;
  url: string;
  finalUrl: string | null;
  status: number | null;
  redirects: { from: string; to: string; status: number }[];
  /** Rendered HTML of the page (post-JS). Capped to 2 MB. */
  html: string | null;
  /** Base64-encoded JPEG screenshot. data: URL. Capped automatically. */
  screenshot: string | null;
  responseHeaders: Record<string, string>;
  /** Counts and snippets of console output. */
  consoleErrors: { text: string }[];
  consoleWarnings: { text: string }[];
  networkErrors: { url: string; message: string }[];
  /** Quick on-page facts pulled out of the rendered DOM. */
  page: {
    title: string | null;
    metaDescription: string | null;
    canonical: string | null;
    h1: string | null;
    linkCount: number;
    imageCount: number;
    scriptCount: number;
    schemaTypes: string[];
  };
  /** Total time from goto start to settle, in ms. */
  loadMs: number | null;
  measuredAt: string;
  error?: string;
};

export type RenderOptions = {
  device?: "mobile" | "desktop";
  /** Wait condition. "domcontentloaded" is fastest, "networkidle" is fullest. */
  waitUntil?: "domcontentloaded" | "load" | "networkidle";
  /** Extra ms to wait after the wait-condition fires (lazy hydration). */
  extraWaitMs?: number;
  /** Capture screenshot? Disable to save time + bandwidth. */
  screenshot?: boolean;
  /** Full-page screenshot vs viewport only. */
  fullPage?: boolean;
};

const NAV_TIMEOUT_MS = 30_000;

export async function renderAndCapture(
  url: string,
  opts: RenderOptions = {},
): Promise<RenderResult> {
  const device = opts.device ?? "desktop";
  const viewport =
    device === "mobile" ? { width: 412, height: 915 } : { width: 1366, height: 900 };
  const ua =
    device === "mobile"
      ? "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
      : undefined;
  const waitUntil = opts.waitUntil ?? "load";
  const extraWaitMs = opts.extraWaitMs ?? 1500;
  const wantScreenshot = opts.screenshot !== false;
  const fullPage = opts.fullPage ?? true;

  return withBrowserContext(
    async (context) => {
      const page = await context.newPage();
      const measuredAt = new Date().toISOString();
      const consoleErrors: { text: string }[] = [];
      const consoleWarnings: { text: string }[] = [];
      const networkErrors: { url: string; message: string }[] = [];
      const redirects: { from: string; to: string; status: number }[] = [];
      let topResponseHeaders: Record<string, string> = {};
      let topStatus: number | null = null;

      page.on("console", (msg) => {
        const text = msg.text().slice(0, 500);
        if (msg.type() === "error") consoleErrors.push({ text });
        else if (msg.type() === "warning") consoleWarnings.push({ text });
      });
      page.on("requestfailed", (req) => {
        networkErrors.push({
          url: req.url(),
          message: req.failure()?.errorText ?? "unknown",
        });
      });
      page.on("response", (res) => {
        if (res.url() === url || res.url() === res.request().url()) {
          // Track redirects on the main frame
          if (
            res.request().resourceType() === "document" &&
            res.status() >= 300 &&
            res.status() < 400
          ) {
            const loc = res.headers()["location"];
            if (loc) {
              redirects.push({ from: res.url(), to: loc, status: res.status() });
            }
          }
        }
      });

      try {
        await page.setViewportSize(viewport);
        if (ua) {
          await context.setExtraHTTPHeaders({ "user-agent": ua });
        }

        const start = Date.now();
        const resp = await page.goto(url, {
          waitUntil,
          timeout: NAV_TIMEOUT_MS,
        });
        if (resp) {
          topStatus = resp.status();
          topResponseHeaders = resp.headers();
        }

        if (extraWaitMs > 0) {
          await page.waitForTimeout(extraWaitMs);
        }

        const loadMs = Date.now() - start;
        const finalUrl = page.url();

        const html = (await page.content()).slice(0, 2_000_000);

        let screenshot: string | null = null;
        if (wantScreenshot) {
          try {
            const buf = await page.screenshot({
              type: "jpeg",
              quality: 70,
              fullPage,
            });
            screenshot = `data:image/jpeg;base64,${buf.toString("base64")}`;
          } catch {
            screenshot = null;
          }
        }

        const pageFacts = await page.evaluate(() => {
          const title = document.title?.trim() || null;
          const md = document.querySelector(
            "meta[name='description']",
          ) as HTMLMetaElement | null;
          const metaDescription = md?.content?.trim() || null;
          const canon = document.querySelector(
            "link[rel='canonical']",
          ) as HTMLLinkElement | null;
          const canonical = canon?.href?.trim() || null;
          const h1Raw = document.querySelector("h1")?.textContent ?? "";
          const h1 = h1Raw.trim() || null;
          const linkCount = document.querySelectorAll("a[href]").length;
          const imageCount = document.querySelectorAll("img").length;
          const scriptCount = document.querySelectorAll("script").length;

          const schemaTypes = new Set<string>();
          for (const s of Array.from(
            document.querySelectorAll('script[type="application/ld+json"]'),
          )) {
            try {
              const parsed = JSON.parse(s.textContent ?? "");
              const items = Array.isArray(parsed) ? parsed : [parsed];
              for (const item of items) {
                if (item && typeof item === "object") {
                  const t = (item as { "@type"?: string | string[] })["@type"];
                  if (typeof t === "string") schemaTypes.add(t);
                  else if (Array.isArray(t)) t.forEach((x) => schemaTypes.add(String(x)));
                }
              }
            } catch {
              // skip invalid JSON-LD
            }
          }

          return {
            title,
            metaDescription,
            canonical,
            h1,
            linkCount,
            imageCount,
            scriptCount,
            schemaTypes: Array.from(schemaTypes).slice(0, 12),
          };
        });

        return {
          ok: true,
          url,
          finalUrl,
          status: topStatus,
          redirects,
          html,
          screenshot,
          responseHeaders: topResponseHeaders,
          consoleErrors: consoleErrors.slice(0, 50),
          consoleWarnings: consoleWarnings.slice(0, 50),
          networkErrors: networkErrors.slice(0, 50),
          page: pageFacts,
          loadMs,
          measuredAt,
        };
      } catch (err) {
        return emptyResult(url, measuredAt, (err as Error).message);
      } finally {
        await page.close().catch(() => {});
      }
    },
    { viewport, userAgent: ua },
  );
}

function emptyResult(
  url: string,
  measuredAt: string,
  error: string,
): RenderResult {
  return {
    ok: false,
    url,
    finalUrl: null,
    status: null,
    redirects: [],
    html: null,
    screenshot: null,
    responseHeaders: {},
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    page: {
      title: null,
      metaDescription: null,
      canonical: null,
      h1: null,
      linkCount: 0,
      imageCount: 0,
      scriptCount: 0,
      schemaTypes: [],
    },
    loadMs: null,
    measuredAt,
    error,
  };
}
