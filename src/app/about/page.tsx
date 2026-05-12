import Link from "next/link";
import {
  Code2,
  Globe,
  Heart,
  Info,
  Keyboard,
  Scale,
  Sparkles,
} from "lucide-react";
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

      {/* Developer / website strip */}
      <section className="grid gap-3 sm:grid-cols-3">
        {MAINTAINER.website && (
          <a
            href={MAINTAINER.website}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-card/40 p-4 transition-colors hover:bg-card/60"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/30">
              <Globe className="size-4" />
            </span>
            <div>
              <div className="text-sm font-semibold group-hover:text-violet-200">
                dicecodes.com
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                The developer&apos;s site. Other projects, contact, hire.
              </div>
            </div>
          </a>
        )}
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
                Star, fork, audit, contribute, or self-host whichever way
                suits.
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

      {/* License — plain-English summary of PolyForm Noncommercial 1.0.0 */}
      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 space-y-3 text-sm">
        <h2 className="flex items-center gap-2 font-semibold">
          <Scale className="size-4 text-amber-300" />
          License — free to use, not free to sell
        </h2>
        <p className="text-muted-foreground text-xs leading-relaxed">
          This tool is published under the{" "}
          <a
            href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-amber-300 hover:underline"
          >
            PolyForm Noncommercial 1.0.0
          </a>{" "}
          license. It&apos;s source-available, not strictly open-source
          in the OSI sense — DiceCodes chose this to keep the project
          permanently free for end users while preventing resale and
          paid SaaS clones.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-emerald-500/[0.05] p-3 ring-1 ring-inset ring-emerald-500/20">
            <p className="mb-1.5 text-xs font-semibold text-emerald-300">
              You can — freely
            </p>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              <li>• Self-host for your own SEO work (any volume)</li>
              <li>• Use it for client work as a freelancer / agency</li>
              <li>• Modify, fork, and adapt the code</li>
              <li>• Share copies under these same terms</li>
              <li>• Contribute back via pull requests</li>
            </ul>
          </div>
          <div className="rounded-lg bg-rose-500/[0.05] p-3 ring-1 ring-inset ring-rose-500/20">
            <p className="mb-1.5 text-xs font-semibold text-rose-300">
              You cannot, without written permission
            </p>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              <li>• Sell the software or any derivative</li>
              <li>• Offer it as a paid hosted service (SaaS)</li>
              <li>• Re-license it under a different license</li>
              <li>• Strip the DiceCodes credit and rebrand as your own</li>
            </ul>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          For commercial licensing (paid SaaS, white-label resale, OEM
          embedding), email{" "}
          <a
            href={`mailto:${MAINTAINER.contactEmail}`}
            className="text-amber-300 hover:underline"
          >
            {MAINTAINER.contactEmail}
          </a>
          . Pricing is per-deployment, not per-seat.
        </p>
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
