"use server";

import {
  generateCoverImagePrompts,
  suggestCategoriesAndTags,
  type CategoryResult,
  type ImagePromptResult,
} from "@/lib/content-helpers";

export async function getCoverImagePrompts(formData: FormData): Promise<ImagePromptResult> {
  const title = String(formData.get("title") ?? "").trim();
  const brief = String(formData.get("brief") ?? "").trim();
  const niche = String(formData.get("niche") ?? "").trim() || null;
  if (!title) return { ok: false, error: "Post title required." };
  return await generateCoverImagePrompts({ title, brief, niche });
}

export async function getCategorySuggestions(
  formData: FormData,
): Promise<CategoryResult> {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const existingRaw = String(formData.get("existingCategories") ?? "").trim();
  const existingCategories = existingRaw
    ? existingRaw
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  if (!title) return { ok: false, error: "Title required." };
  return await suggestCategoriesAndTags({ title, excerpt, existingCategories });
}
