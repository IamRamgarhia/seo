"use client";

import { useActionState, useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  analyzeSite,
  deleteBrief,
  generateAndSaveDraft,
  markBriefPosted,
  suggestTitleVariants,
  suggestTopics,
  unmarkBriefPosted,
  type AnalyzeState,
  type DraftState,
  type SuggestState,
} from "./actions";
import type { BulkBlogTopic, SiteBlogContext } from "@/lib/bulk-blog-planner";
import type { ContentBrief } from "@/db/schema";
import { AiDisclaimer } from "@/components/ai-disclaimer";

type Tab = "wizard" | "drafts";

export function BulkBlogWizard({
  clientId,
  clientName,
  clientUrl,
  briefs,
}: {
  clientId: number;
  clientName: string;
  clientUrl: string;
  briefs: ContentBrief[];
}) {
  const [tab, setTab] = useState<Tab>("wizard");
  const draftCount = briefs.filter((b) => b.status !== "published").length;
  const postedCount = briefs.filter((b) => b.status === "published").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 text-xs">
        <button
          type="button"
          onClick={() => setTab("wizard")}
          className={tabClass(tab === "wizard")}
        >
          Plan + write
        </button>
        <button
          type="button"
          onClick={() => setTab("drafts")}
          className={tabClass(tab === "drafts")}
        >
          Library ({briefs.length})
          {postedCount > 0 && (
            <span className="ml-1 text-emerald-300">· {postedCount} posted</span>
          )}
        </button>
      </div>

      {tab === "wizard" && (
        <Wizard
          clientId={clientId}
          clientName={clientName}
          clientUrl={clientUrl}
        />
      )}
      {tab === "drafts" && (
        <DraftsLibrary briefs={briefs} draftCount={draftCount} />
      )}
    </div>
  );
}

function tabClass(active: boolean): string {
  return `rounded-full px-3 py-1 ring-1 ring-inset transition-colors ${
    active
      ? "bg-violet-500/15 text-violet-300 ring-violet-500/30"
      : "bg-white/5 text-muted-foreground ring-white/10 hover:bg-white/10"
  }`;
}

function Wizard({
  clientId,
  clientName,
  clientUrl,
}: {
  clientId: number;
  clientName: string;
  clientUrl: string;
}) {
  const [analyzeState, analyzeAction, analyzing] = useActionState<
    AnalyzeState,
    FormData
  >(analyzeSite, null);
  const [suggestState, suggestAction, suggesting] = useActionState<
    SuggestState,
    FormData
  >(suggestTopics, null);
  const [count, setCount] = useState<number>(8);
  const [hints, setHints] = useState("");

  const ctx = analyzeState?.ok ? analyzeState.ctx : null;
  const ctxJson = ctx ? JSON.stringify(ctx) : "";

  return (
    <div className="space-y-4">
      {/* Step 1: site analysis */}
      <section className="glass-apple relative overflow-hidden rounded-2xl">
        <header className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Search className="size-4 text-cyan-300" />
            Step 1 · Understand the site
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pulls <strong>{clientUrl}</strong> and asks the AI to summarize
            what the site is about.
          </p>
        </header>
        <div className="p-5">
          {!ctx && (
            <form action={analyzeAction}>
              <input type="hidden" name="clientId" value={clientId} />
              <button
                type="submit"
                disabled={analyzing}
                className="inline-flex h-9 items-center rounded-md bg-cyan-500/15 px-4 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/30 hover:bg-cyan-500/25 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 size-3 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Search className="mr-2 size-3" />
                    Analyze {clientName}&apos;s site
                  </>
                )}
              </button>
            </form>
          )}
          {analyzeState && !analyzeState.ok && (
            <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
              {analyzeState.error}
            </p>
          )}
          {ctx && <CtxDisplay ctx={ctx} />}
        </div>
      </section>

      {/* Step 2: bulk topic generation */}
      {ctx && (
        <section className="glass-apple relative overflow-hidden rounded-2xl">
          <header className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="size-4 text-violet-300" />
              Step 2 · Generate topic ideas
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              How many posts do you want to plan? AI will spread search
              intents and skip topics the site already covers.
            </p>
          </header>
          <form
            action={suggestAction}
            className="grid gap-3 p-5 md:grid-cols-[120px_1fr_auto]"
          >
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="ctx" value={ctxJson} />
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">How many posts?</span>
              <input
                name="count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">
                Extra hints (optional) — e.g. &quot;focus on bottom-funnel&quot; or
                &quot;avoid product X&quot;
              </span>
              <input
                name="hints"
                value={hints}
                onChange={(e) => setHints(e.target.value)}
                className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={suggesting}
              className="mt-5 inline-flex h-9 items-center rounded-md bg-violet-500/15 px-4 text-xs font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30 hover:bg-violet-500/25 disabled:opacity-50"
            >
              {suggesting ? (
                <>
                  <Loader2 className="mr-2 size-3 animate-spin" />
                  Suggesting…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-3" />
                  Generate {count} ideas
                </>
              )}
            </button>
          </form>
          {suggestState && !suggestState.ok && (
            <p className="mx-5 mb-5 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
              {suggestState.error}
            </p>
          )}
        </section>
      )}

      {/* Step 3: topic cards with per-topic draft generation */}
      {ctx && suggestState?.ok && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Step 3 · Edit titles or click &quot;Generate full draft&quot; for any
            topic. Drafts auto-save to the Library tab.
          </p>
          {suggestState.topics.map((topic, i) => (
            <TopicCard
              key={i}
              clientId={clientId}
              ctxJson={ctxJson}
              topic={topic}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CtxDisplay({ ctx }: { ctx: SiteBlogContext }) {
  return (
    <div className="space-y-3 rounded-md border border-white/5 bg-black/20 p-4 text-xs">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300/90">
          Summary
        </p>
        <p className="mt-1">{ctx.summary}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Audience
          </p>
          <p>{ctx.audience}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tone
          </p>
          <p>{ctx.tone}</p>
        </div>
      </div>
      {ctx.offerings.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Offerings
          </p>
          <p>{ctx.offerings.join(" · ")}</p>
        </div>
      )}
      {ctx.existingTopics.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Existing topics (we&apos;ll avoid these)
          </p>
          <p>{ctx.existingTopics.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}

const INTENT_TONE: Record<string, string> = {
  informational: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  commercial: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  transactional: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  navigational: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
};

function TopicCard({
  clientId,
  ctxJson,
  topic,
}: {
  clientId: number;
  ctxJson: string;
  topic: BulkBlogTopic;
}) {
  const [title, setTitle] = useState(topic.title);
  const [keyword, setKeyword] = useState(topic.targetKeyword);
  const [wordCount, setWordCount] = useState<800 | 1200 | 1500 | 2000>(
    ([800, 1200, 1500, 2000].includes(topic.estimatedWordCount)
      ? topic.estimatedWordCount
      : 1200) as 800 | 1200 | 1500 | 2000,
  );
  const [variants, setVariants] = useState<string[] | null>(null);
  const [variantsPending, startVariants] = useTransition();
  const [draftState, formAction, drafting] = useActionState<
    DraftState,
    FormData
  >(generateAndSaveDraft, null);
  const draft = draftState?.ok ? draftState : null;
  const [showDraft, setShowDraft] = useState(false);

  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl">
      <header className="flex flex-wrap items-start gap-3 border-b border-white/[0.06] px-5 py-4">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ring-1 ring-inset ${
            INTENT_TONE[topic.searchIntent] ?? INTENT_TONE.informational
          }`}
        >
          {topic.searchIntent}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs text-muted-foreground">{topic.rationale}</p>
          <p className="text-[11px] text-muted-foreground/80">
            <span className="font-medium text-violet-300">Angle:</span>{" "}
            {topic.suggestedAngle}
          </p>
        </div>
      </header>
      <form action={formAction} className="space-y-3 p-5">
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="angle" value={topic.suggestedAngle} />
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Title (edit if you like)</span>
            <button
              type="button"
              disabled={variantsPending || !title.trim()}
              onClick={() => {
                setVariants(null);
                startVariants(async () => {
                  const v = await suggestTitleVariants(
                    clientId,
                    ctxJson,
                    title,
                    keyword,
                  );
                  setVariants(v);
                });
              }}
              className="inline-flex h-6 items-center gap-1 rounded-md bg-violet-500/10 px-2 text-[10px] font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30 hover:bg-violet-500/20 disabled:opacity-50"
            >
              {variantsPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Wand2 className="size-3" />
              )}
              AI suggest 3 variants
            </button>
          </div>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm"
          />
          {variants && variants.length > 0 && (
            <div className="space-y-1 rounded-md border border-violet-500/20 bg-violet-500/5 p-2 text-[11px]">
              <p className="text-muted-foreground">Click to use:</p>
              {variants.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTitle(v);
                    setVariants(null);
                  }}
                  className="block w-full rounded px-2 py-1 text-left hover:bg-violet-500/10"
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_140px]">
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Target keyword</span>
            <input
              name="targetKeyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Length</span>
            <select
              name="wordCount"
              value={wordCount}
              onChange={(e) =>
                setWordCount(Number(e.target.value) as 800 | 1200 | 1500 | 2000)
              }
              className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm"
            >
              <option value={800}>~800</option>
              <option value={1200}>~1200</option>
              <option value={1500}>~1500</option>
              <option value={2000}>~2000</option>
            </select>
          </label>
        </div>
        <input type="hidden" name="tone" value="professional" />
        <input type="hidden" name="audienceLevel" value="intermediate" />

        <button
          type="submit"
          disabled={drafting || !title.trim() || !keyword.trim()}
          className="inline-flex h-9 items-center rounded-md bg-emerald-500/15 px-4 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50"
        >
          {drafting ? (
            <>
              <Loader2 className="mr-2 size-3 animate-spin" />
              Writing draft…
            </>
          ) : (
            <>
              <Wand2 className="mr-2 size-3" />
              Generate full draft + save
            </>
          )}
        </button>
        {draftState && !draftState.ok && (
          <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
            {draftState.error}
          </p>
        )}
        {draft && (
          <div className="space-y-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-emerald-300">
                <CheckCircle2 className="mr-1 inline size-3" />
                Draft saved as #{draft.briefId}. Find it in the Library tab.
              </span>
              <button
                type="button"
                onClick={() => setShowDraft((s) => !s)}
                className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-white/10"
              >
                {showDraft ? "Hide" : "Show"}
                {showDraft ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
              </button>
            </div>
            {showDraft && (
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded bg-black/30 p-3 font-mono text-[11px] leading-relaxed">
                {draft.markdown}
              </pre>
            )}
            <AiDisclaimer variant="inline" />
          </div>
        )}
      </form>
    </section>
  );
}

const STATUS_TONE: Record<string, string> = {
  idea: "bg-white/5 text-muted-foreground ring-white/10",
  outline: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  draft: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  review: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  published: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
};

function DraftsLibrary({
  briefs,
  draftCount,
}: {
  briefs: ContentBrief[];
  draftCount: number;
}) {
  if (briefs.length === 0)
    return (
      <p className="rounded-2xl border border-white/5 bg-card/40 px-5 py-12 text-center text-sm text-muted-foreground backdrop-blur-md">
        No drafts yet. Generate ideas in the &quot;Plan + write&quot; tab.
      </p>
    );
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {draftCount} draft{draftCount === 1 ? "" : "s"} ready to post.
      </p>
      {briefs.map((b) => (
        <DraftRow key={b.id} brief={b} />
      ))}
    </div>
  );
}

function DraftRow({ brief }: { brief: ContentBrief }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const md = brief.notes ?? "";
  const isPosted = brief.status === "published";

  function copy() {
    navigator.clipboard.writeText(md);
  }
  function download(format: "md" | "html" | "txt") {
    const slug =
      brief.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "post";
    let body = md;
    let mime = "text/markdown";
    if (format === "txt") {
      body = md.replace(/[#*_`>]/g, "").replace(/\[(.+?)\]\(.+?\)/g, "$1");
      mime = "text/plain";
    } else if (format === "html") {
      body = mdToBasicHtml(md);
      mime = "text/html";
    }
    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl">
      <header className="flex flex-wrap items-center gap-3 px-5 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STATUS_TONE[brief.status]}`}
        >
          {brief.status}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-medium">{brief.title}</p>
          <p className="text-[11px] text-muted-foreground">
            target: {brief.targetKeyword} · saved{" "}
            {brief.createdAt.toLocaleDateString()}
            {brief.targetWordCount && (
              <> · ~{brief.targetWordCount}w</>
            )}
          </p>
          {brief.publishedUrl && (
            <a
              href={brief.publishedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:underline"
            >
              <ExternalLink className="size-3" />
              {brief.publishedUrl.replace(/^https?:\/\//, "").slice(0, 70)}
            </a>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/10"
            aria-label="Toggle"
          >
            {open ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("Delete this draft? This cannot be undone.")) return;
              startTransition(async () => {
                await deleteBrief(brief.id);
              });
            }}
            className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50"
            aria-label="Delete"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </header>
      {open && (
        <div className="space-y-3 border-t border-white/5 bg-black/20 p-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-7 items-center gap-1 rounded-md bg-white/5 px-2 text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10"
            >
              <Copy className="size-3" />
              Copy markdown
            </button>
            <button
              type="button"
              onClick={() => download("md")}
              className="inline-flex h-7 items-center gap-1 rounded-md bg-white/5 px-2 text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10"
            >
              <Download className="size-3" /> .md
            </button>
            <button
              type="button"
              onClick={() => download("html")}
              className="inline-flex h-7 items-center gap-1 rounded-md bg-white/5 px-2 text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10"
            >
              <FileDown className="size-3" /> .html
            </button>
            <button
              type="button"
              onClick={() => download("txt")}
              className="inline-flex h-7 items-center gap-1 rounded-md bg-white/5 px-2 text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10"
            >
              <FileDown className="size-3" /> .txt
            </button>
            {isPosted ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    await unmarkBriefPosted(brief.id);
                  });
                }}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-amber-500/15 px-2 font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/25 disabled:opacity-50"
              >
                <RotateCcw className="size-3" />
                Mark as not posted
              </button>
            ) : (
              <form
                action={markBriefPosted.bind(null, brief.id)}
                className="inline-flex flex-wrap items-center gap-1"
              >
                <input
                  name="publishedUrl"
                  placeholder="https://yoursite.com/blog/post-slug"
                  className="h-7 w-64 rounded-md border border-white/10 bg-card/60 px-2 text-[11px]"
                />
                <button
                  type="submit"
                  className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-500/15 px-2 font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/25"
                >
                  <CheckCircle2 className="size-3" />
                  Mark as posted
                </button>
              </form>
            )}
          </div>
          <pre className="max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded bg-black/30 p-3 font-mono text-[12px] leading-relaxed">
            {md || "(empty draft)"}
          </pre>
          <AiDisclaimer variant="inline" />
        </div>
      )}
    </section>
  );
}

function mdToBasicHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html
    .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
    .replace(/^##### (.*)$/gm, "<h5>$1</h5>")
    .replace(/^#### (.*)$/gm, "<h4>$1</h4>")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^[-*] (.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>(\n)?)+/g, "<ul>$&</ul>");
  // Paragraphs
  html = html
    .split(/\n{2,}/)
    .map((para) =>
      /^<(h\d|ul|ol|p|pre|blockquote)/.test(para.trim())
        ? para
        : `<p>${para.replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Blog post</title>
</head>
<body>
${html}
</body>
</html>`;
}
