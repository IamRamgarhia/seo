"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  CalendarDays,
  Check,
  Copy,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  generateGbpPostIdeas,
  type GbpPostIdea,
} from "@/app/gbp/actions";
import { AiFeedback } from "@/components/ai-feedback";
import { AiDisclaimer } from "@/components/ai-disclaimer";

const TYPE_TONE: Record<GbpPostIdea["postType"], string> = {
  offer: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  event: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  update: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  product: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  story: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
};

export function GbpPostIdeas({
  clientId,
  clientName,
  niche,
  city,
  businessType,
  description,
}: {
  clientId: number;
  clientName: string;
  niche: string | null;
  city: string | null;
  businessType: string | null;
  description: string | null;
}) {
  const [ideas, setIdeas] = useState<GbpPostIdea[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function generate() {
    setError(null);
    setIdeas(null);
    setBusy(true);
    startTransition(async () => {
      const r = await generateGbpPostIdeas({
        clientId,
        clientName,
        niche,
        city,
        businessType,
        description,
      });
      setBusy(false);
      if (r.ok) setIdeas(r.ideas);
      else setError(r.error);
    });
  }

  function copyIdea(i: number, idea: GbpPostIdea) {
    const txt = `${idea.title}\n\n${idea.angle}\n\nCTA: ${idea.cta}`;
    navigator.clipboard.writeText(txt).then(() => {
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  }

  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="size-4 text-amber-300" />
            7-day GBP post calendar
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            AI-generated post ideas for the upcoming week. Use them as starting
            points — feed any one back into the composer above to draft full
            copy.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-md bg-amber-500/15 px-4 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/25 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-3 animate-spin" />
              Drafting…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-3" />
              {ideas ? "Regenerate week" : "Generate 7-day plan"}
            </>
          )}
        </button>
      </header>

      {error && (
        <p className="mx-5 mt-4 rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
          {error}
        </p>
      )}

      {ideas && ideas.length > 0 && (
        <>
          <ul className="divide-y divide-white/[0.05]">
            {ideas.map((idea, i) => (
              <li key={i} className="px-5 py-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10">
                    <Calendar className="size-4 text-amber-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {idea.day}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ring-1 ring-inset ${TYPE_TONE[idea.postType]}`}
                      >
                        {idea.postType}
                      </span>
                    </div>
                    <p className="mt-1 font-medium">{idea.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {idea.angle}
                    </p>
                    <p className="mt-1.5 text-[11px]">
                      <span className="font-medium text-amber-300">CTA:</span>{" "}
                      <span className="text-foreground/80">{idea.cta}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyIdea(i, idea)}
                    className="inline-flex h-8 items-center rounded-md bg-white/5 px-2.5 text-[11px] text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-foreground"
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
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] px-5 py-3">
            <AiFeedback
              feature="content_idea"
              aiOutput={ideas
                .map((i) => `${i.day}: ${i.title} (${i.postType}) — ${i.angle}`)
                .join("\n")}
              clientId={clientId}
              size="sm"
            />
            <AiDisclaimer variant="inline" />
          </div>
        </>
      )}
    </section>
  );
}
