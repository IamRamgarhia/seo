import Link from "next/link";
import { Code2, Heart, Info, Keyboard, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { MaintainerCredit } from "@/components/shell/maintainer-credit";
import { MAINTAINER } from "@/lib/maintainer";

export const dynamic = "force-static";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="About this tool"
        description="Who built it, what it stands for, how to support it."
        icon={Info}
        accent="violet"
      />

      <MaintainerCredit variant="block" />

      <section className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3 text-sm">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-cyan-300" />
          What this is
        </h2>
        <p className="text-muted-foreground">
          A self-hosted SEO platform for freelancers, small agencies, and
          site owners. 100+ tools across audits, rank tracking, content,
          backlinks, local SEO, AI visibility, paid ads — all running on
          your own machine. No monthly fees, no surveillance, no paid
          APIs required to get started.
        </p>
        <ul className="space-y-1.5 text-xs">
          <li className="flex gap-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-400" />
            <span>
              <strong className="text-foreground">Free-first.</strong>{" "}
              Uses Google&apos;s free APIs (GSC, GA4, PSI) + headless
              browser fallbacks. Paid keys are optional, BYO.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-400" />
            <span>
              <strong className="text-foreground">Privacy-first.</strong>{" "}
              All data lives in a single SQLite file on your machine. No
              telemetry, no phone-home, no analytics.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-400" />
            <span>
              <strong className="text-foreground">Tech-stack-aware.</strong>{" "}
              Recommendations adapt to WordPress / Shopify / Next.js /
              Webflow / etc. Detected automatically.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-emerald-400" />
            <span>
              <strong className="text-foreground">One AI key.</strong>{" "}
              Plug in any free provider (Gemini / Groq / DeepSeek) once
              and every AI feature works — with workspace-wide
              concurrency limiting so automation never starves manual
              actions.
            </span>
          </li>
        </ul>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {MAINTAINER.github && (
          <a
            href={MAINTAINER.github}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-card/40 p-4 transition-colors hover:bg-card/60"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-foreground/80 ring-1 ring-inset ring-white/10">
              <Code2 className="size-4" />
            </span>
            <div>
              <div className="text-sm font-semibold group-hover:text-violet-200">
                Source code
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                MIT / AGPL hybrid. Fork, audit, contribute, or self-host
                whichever way suits.
              </div>
            </div>
          </a>
        )}
        <Link
          href="/shortcuts"
          className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-card/40 p-4 transition-colors hover:bg-card/60"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-500/30">
            <Keyboard className="size-4" />
          </span>
          <div>
            <div className="text-sm font-semibold group-hover:text-cyan-200">
              Keyboard shortcuts
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              Every binding the app responds to. Press{" "}
              <kbd className="rounded bg-white/5 px-1">?</kbd> anywhere.
            </div>
          </div>
        </Link>
      </section>

      <p className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4 text-xs text-rose-200">
        <Heart className="mr-1 inline size-3.5" />
        If this tool saves you the cost of an Ahrefs / Semrush
        subscription, a small UPI tip or coffee keeps the lights on.
        The <strong>Support the project</strong> button above opens the
        UPI ID + Buy Me A Coffee options.
      </p>
    </div>
  );
}
