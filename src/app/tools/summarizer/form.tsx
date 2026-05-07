"use client";

import { useActionState, useState } from "react";
import { Check, Copy, FileText, Loader2 } from "lucide-react";
import { runSummarize, type SumState } from "./actions";

export function SummarizerForm() {
  const [state, formAction, pending] = useActionState<SumState | null, FormData>(
    runSummarize,
    null,
  );
  const [copied, setCopied] = useState<string | null>(null);

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <>
      <form
        action={formAction}
        className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3"
      >
        <textarea
          name="text"
          required
          rows={10}
          spellCheck={false}
          placeholder="Paste content here…"
          className="w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-md bg-cyan-500/15 px-5 text-sm font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/30 hover:bg-cyan-500/25 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Summarizing…
            </>
          ) : (
            <>
              <FileText className="mr-2 size-4" />
              Summarize
            </>
          )}
        </button>
      </form>

      {state && !state.ok && (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
          {state.error}
        </p>
      )}

      {state?.ok && (
        <div className="space-y-3">
          <Block
            label="TL;DR"
            text={state.summary.tldr}
            copied={copied === "tldr"}
            onCopy={() => copy("tldr", state.summary.tldr)}
          />
          <Block
            label={`Meta description (${state.summary.metaDescription.length} chars)`}
            text={state.summary.metaDescription}
            copied={copied === "meta"}
            onCopy={() => copy("meta", state.summary.metaDescription)}
          />
          {state.summary.tweetableQuote && (
            <Block
              label="Tweetable quote"
              text={state.summary.tweetableQuote}
              copied={copied === "quote"}
              onCopy={() => copy("quote", state.summary.tweetableQuote)}
            />
          )}
          <section className="glass-apple relative overflow-hidden rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Key takeaways</h3>
              <button
                type="button"
                onClick={() =>
                  copy(
                    "takeaways",
                    state.summary.keyTakeaways.map((t) => `• ${t}`).join("\n"),
                  )
                }
                className="inline-flex h-7 items-center rounded-md bg-white/5 px-2 text-[11px] text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10"
              >
                {copied === "takeaways" ? (
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
            <ul className="mt-3 space-y-1.5 text-sm">
              {state.summary.keyTakeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-400" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}

function Block({
  label,
  text,
  copied,
  onCopy,
}: {
  label: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="glass-apple relative overflow-hidden rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-7 items-center rounded-md bg-white/5 px-2 text-[11px] text-muted-foreground ring-1 ring-inset ring-white/10 hover:bg-white/10"
        >
          {copied ? (
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
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </section>
  );
}
