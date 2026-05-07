"use server";

import {
  fetchImagesFromUrl,
  generateBulkAlt,
  type AltSuggestion,
} from "@/lib/content-ai-helpers";

export type AltState =
  | { ok: true; pageContext: string; suggestions: AltSuggestion[] }
  | { ok: false; error: string };

export async function runBulkAlt(
  _prev: AltState | null,
  formData: FormData,
): Promise<AltState> {
  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { ok: false, error: "URL required." };
  const fullUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const fetched = await fetchImagesFromUrl(fullUrl);
  if (!fetched) return { ok: false, error: "Couldn't fetch the page." };
  if (fetched.images.length === 0)
    return { ok: false, error: "No images on this page." };

  const r = await generateBulkAlt({
    pageContext: fetched.pageContext,
    imageDescriptions: fetched.images,
  });
  if (!r.ok) return { ok: false, error: r.error };
  return {
    ok: true,
    pageContext: fetched.pageContext,
    suggestions: r.suggestions,
  };
}
