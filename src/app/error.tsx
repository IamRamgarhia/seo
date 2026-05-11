"use client";

/**
 * Page-level error boundary. Translates the raw error into plain
 * English via friendlyError(), shows actionable steps, and offers a
 * pre-filled GitHub-issue link when we don't have a known fix.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Bug,
  Home,
  RefreshCw,
} from "lucide-react";
import { friendlyError, ghIssueLink } from "@/lib/friendly-error";

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const fe = useMemo(
    () =>
      friendlyError(
        error.message || "Unknown error",
        "page-error-boundary",
        error.stack,
      ),
    [error],
  );
  const issueUrl = useMemo(() => ghIssueLink(fe), [fe]);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context: "page-error-boundary",
        url: typeof window !== "undefined" ? location.href : null,
      }),
    }).catch(() => undefined);
  }, [error]);

  async function copyDetails() {
    const text = [
      `Error: ${error.message}`,
      error.digest ? `Digest: ${error.digest}` : "",
      `URL: ${typeof window !== "undefined" ? location.href : "n/a"}`,
      "",
      "Stack:",
      error.stack ?? "(no stack)",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function restart() {
    if (!confirm("Restart the server? The page will reload itself once it's back.")) return;
    try {
      await fetch("/api/restart", { method: "POST" });
      setTimeout(function poll() {
        fetch("/api/health-ping", { cache: "no-store" })
          .then(() => location.reload())
          .catch(() => setTimeout(poll, 1500));
      }, 3000);
    } catch {}
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center space-y-5 py-12">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-300">
          <AlertTriangle className="size-3" />
          Error
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {fe.title}
        </h1>
        <p className="text-[14px] text-muted-foreground">{fe.explanation}</p>
      </div>

      {/* Try these steps */}
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          <CheckCircle2 className="size-3 text-emerald-300" />
          Try this
        </h2>
        <ol className="mt-2 space-y-1.5 text-[13px] text-foreground">
          {fe.steps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Recovery actions */}
      <div className="grid gap-2 sm:grid-cols-2">
        <ActionButton
          icon={RefreshCw}
          title="Try this page again"
          onClick={() => reset()}
          primary
        />
        <ActionButton icon={Home} title="Go to dashboard" href="/" />
        <ActionButton
          icon={ArrowLeft}
          title="Go back"
          onClick={() => history.back()}
        />
        <ActionButton
          icon={RefreshCw}
          title="Restart the server"
          onClick={restart}
        />
      </div>

      {fe.helpLink && (
        <Link
          href={fe.helpLink.href}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-violet-300 hover:underline"
        >
          {fe.helpLink.label}
          <ExternalLink className="size-3" />
        </Link>
      )}

      {/* GitHub issue prefill */}
      {issueUrl && (
        <div className="rounded-md border border-border bg-muted/20 p-4">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <Bug className="size-3.5" />
            Still stuck?
          </h3>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Open a pre-filled GitHub issue — everything the maintainer needs is
            already in the body. Takes ~10 seconds.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={issueUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90"
            >
              <Bug className="size-3.5" />
              Report on GitHub
              <ExternalLink className="size-3 opacity-70" />
            </a>
            <button
              type="button"
              onClick={copyDetails}
              className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Copy className="size-3.5" />
              {copied ? "Copied" : "Copy details"}
            </button>
          </div>
        </div>
      )}

      {/* Power-user raw details */}
      <details
        open={showRaw}
        onToggle={(e) => setShowRaw((e.target as HTMLDetailsElement).open)}
        className="rounded-md border border-border bg-muted/10"
      >
        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ChevronRight
            className={`size-3 transition-transform ${showRaw ? "rotate-90" : ""}`}
          />
          Raw error
          {error.digest && (
            <code className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              #{error.digest}
            </code>
          )}
        </summary>
        {showRaw && (
          <pre className="overflow-x-auto border-t border-border bg-background/50 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {error.message}
            {"\n\n"}
            {error.stack ?? "(no stack trace)"}
          </pre>
        )}
      </details>

      <p className="text-[11px] text-muted-foreground">
        Already logged to{" "}
        <Link href="/settings/errors" className="text-violet-300 hover:underline">
          Settings → Error log
        </Link>
        .
      </p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  title,
  onClick,
  href,
  primary,
}: {
  icon: typeof Home;
  title: string;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}) {
  const className = `group flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium transition-colors ${
    primary
      ? "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20"
      : "border-border bg-card text-foreground hover:bg-accent"
  }`;
  const inner = (
    <>
      <Icon
        className={`size-3.5 ${primary ? "text-primary" : "text-muted-foreground"}`}
      />
      <span className="flex-1 text-left">{title}</span>
      <ChevronRight
        className={`size-3 ${primary ? "text-primary" : "text-muted-foreground/60"} transition-transform group-hover:translate-x-0.5`}
      />
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}
