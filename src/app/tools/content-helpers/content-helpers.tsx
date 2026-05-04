"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Copy,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Tags,
} from "lucide-react";
import {
  getCategorySuggestions,
  getCoverImagePrompts,
} from "./actions";
import type {
  CategorySuggestion,
  ImagePromptIdea,
} from "@/lib/content-helpers";

export function ContentHelpers() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ImagePromptCard />
      <CategoryCard />
    </div>
  );
}

function ImagePromptCard() {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [niche, setNiche] = useState("");
  const [prompts, setPrompts] = useState<ImagePromptIdea[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setPrompts(null);
    setBusy(true);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("brief", brief);
    fd.set("niche", niche);
    startTransition(async () => {
      const r = await getCoverImagePrompts(fd);
      setBusy(false);
      if (r.ok) setPrompts(r.prompts);
      else setError(r.error);
    });
  }

  function copy(i: number, p: ImagePromptIdea) {
    navigator.clipboard.writeText(p.prompt).then(() => {
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  }

  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl">
      <header className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <ImageIcon className="size-4 text-rose-300" />
          Cover-image prompts
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Paste these into Stable Diffusion, Midjourney, DALL-E, or any image
          model. 3 distinct visual styles per call.
        </p>
      </header>
      <form onSubmit={generate} className="space-y-3 p-5">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Post title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="The 9 best vegan meal-prep services in 2026"
            className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Brief / angle (optional)</span>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={2}
            placeholder="What the post is about in one or two sentences"
            className="w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Niche (optional)</span>
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="health · saas · ecommerce · local · ..."
            className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="inline-flex h-9 items-center rounded-md bg-rose-500/15 px-4 text-xs font-medium text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-rose-500/25 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-3 animate-spin" />
              Drafting prompts…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-3" />
              Generate prompts
            </>
          )}
        </button>
      </form>
      {error && (
        <p className="mx-5 mb-4 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
          {error}
        </p>
      )}
      {prompts && (
        <ul className="divide-y divide-white/[0.05]">
          {prompts.map((p, i) => (
            <li key={i} className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-rose-300 ring-1 ring-inset ring-rose-500/30">
                  {p.style}
                </span>
                <button
                  type="button"
                  onClick={() => copy(i, p)}
                  className="inline-flex h-7 items-center rounded-md bg-white/5 px-2 text-[11px] text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-foreground"
                >
                  {copiedIdx === i ? (
                    <>
                      <Check className="mr-1 size-3 text-emerald-300" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 size-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm leading-relaxed">{p.prompt}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryCard() {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [existing, setExisting] = useState("");
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setSuggestion(null);
    setBusy(true);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("excerpt", excerpt);
    fd.set("existingCategories", existing);
    startTransition(async () => {
      const r = await getCategorySuggestions(fd);
      setBusy(false);
      if (r.ok) setSuggestion(r.suggestion);
      else setError(r.error);
    });
  }

  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl">
      <header className="border-b border-white/[0.06] px-5 py-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Tags className="size-4 text-cyan-300" />
          Categories + tags
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Avoids tag-soup and category bloat. AI picks one primary category and
          5-10 SEO-worthy tags. Paste your existing categories so it reuses,
          doesn&apos;t reinvent.
        </p>
      </header>
      <form onSubmit={generate} className="space-y-3 p-5">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Post title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="How to set up Cloudflare full-page caching for WordPress"
            className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">
            Excerpt or first paragraph (optional)
          </span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            placeholder="What the post covers"
            className="w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">
            Existing site categories (one per line or comma-separated, optional)
          </span>
          <textarea
            value={existing}
            onChange={(e) => setExisting(e.target.value)}
            rows={3}
            placeholder="Performance&#10;Security&#10;WordPress&#10;Hosting"
            className="w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="inline-flex h-9 items-center rounded-md bg-cyan-500/15 px-4 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/30 hover:bg-cyan-500/25 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-3 animate-spin" />
              Suggesting…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-3" />
              Suggest categories + tags
            </>
          )}
        </button>
      </form>
      {error && (
        <p className="mx-5 mb-4 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
          {error}
        </p>
      )}
      {suggestion && (
        <div className="space-y-3 px-5 pb-5">
          <div className="rounded-xl bg-emerald-500/5 px-4 py-3 ring-1 ring-inset ring-emerald-500/20">
            <div className="text-[10px] uppercase tracking-wider text-emerald-300/90">
              Primary category
            </div>
            <div className="mt-1 text-base font-semibold text-foreground/95">
              {suggestion.primaryCategory}
            </div>
          </div>
          {suggestion.alternateCategories.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Alternates
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.alternateCategories.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-white/5 px-2 py-0.5 text-xs ring-1 ring-inset ring-white/10"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {suggestion.tags.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200 ring-1 ring-inset ring-cyan-500/30"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {suggestion.rationale && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">Why: </span>
              {suggestion.rationale}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
