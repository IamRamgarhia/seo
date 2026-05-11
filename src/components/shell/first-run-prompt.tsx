"use client";

/**
 * First-run prompt. Shown ONCE per browser the first time the user
 * loads the app — offers to install as a PWA and add Desktop +
 * Start Menu shortcuts in one click each. Skip is honored permanently.
 *
 * Stored in localStorage as "seo:first-run-done" (any non-empty value
 * = already shown). Resetting is a manual storage edit, intentional.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AppWindow,
  CheckCircle2,
  Loader2,
  MonitorDown,
  Sparkles,
  X,
} from "lucide-react";
import { safeFetch } from "@/lib/safe-fetch";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KEY = "seo:first-run-done";

export function FirstRunPrompt() {
  const [visible, setVisible] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [pwaDone, setPwaDone] = useState(false);
  const [shortcutDone, setShortcutDone] = useState(false);
  const [shortcutBusy, setShortcutBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    // Already installed as PWA? Then skip — they already did the work.
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari only
      window.navigator.standalone
    ) {
      try {
        window.localStorage.setItem(KEY, "pwa-detected");
      } catch {}
      return;
    }
    // Show after a small delay so the page can paint first
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      setPwaPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setPwaDone(true);
      setPwaPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss(remember: boolean) {
    if (remember) {
      try {
        window.localStorage.setItem(KEY, "done");
      } catch {}
    }
    setVisible(false);
  }

  async function installPwa() {
    if (!pwaPrompt) {
      toast.error("PWA install not available", {
        description:
          "Use Chrome / Edge / Brave to install. On Safari use Share → Add to Dock.",
      });
      return;
    }
    await pwaPrompt.prompt();
    const choice = await pwaPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setPwaDone(true);
      toast.success("Installed as app", {
        description: "Find SEO Tool in your Start Menu / Applications.",
      });
    }
    setPwaPrompt(null);
  }

  async function createShortcut() {
    setShortcutBusy(true);
    const r = await safeFetch<{ ok: boolean; message?: string }>(
      "/api/desktop-shortcut",
      { method: "POST" },
    );
    setShortcutBusy(false);
    if (!r.ok) {
      toast.error("Couldn't create shortcut", { description: r.error });
      return;
    }
    setShortcutDone(true);
    toast.success("Shortcut created", {
      description:
        "Desktop + Start Menu icons added. Right-click the Start Menu entry → Pin to taskbar.",
    });
  }

  if (!visible) return null;

  const isWindows =
    typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);
  const bothDone = pwaDone && (shortcutDone || !isWindows);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
        <div className="flex items-start gap-3 border-b border-border p-5">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-[15px] font-semibold text-foreground">
              Make SEO Tool feel like a real app
            </h2>
            <p className="text-[13px] text-muted-foreground">
              One click each. You can change this any time in{" "}
              <Link
                href="/settings/install"
                className="text-violet-300 hover:underline"
                onClick={() => dismiss(true)}
              >
                Settings → Install
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(false)}
            aria-label="Close"
            className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="space-y-2 p-3">
          <Row
            icon={AppWindow}
            iconColor="text-violet-300"
            title="Install as app (PWA)"
            desc="Own window, no browser chrome. Adds to Start Menu / Applications. Right-click → Pin to taskbar."
            done={pwaDone}
            ctaLabel={pwaPrompt ? "Install" : "Not available"}
            disabled={!pwaPrompt || pwaDone}
            onClick={installPwa}
          />
          {isWindows && (
            <Row
              icon={MonitorDown}
              iconColor="text-cyan-300"
              title="Desktop & Start Menu shortcut"
              desc="Launches the server AND opens the browser — works even when the server is currently off."
              done={shortcutDone}
              busy={shortcutBusy}
              ctaLabel="Create shortcuts"
              disabled={shortcutDone}
              onClick={createShortcut}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 p-3">
          <button
            type="button"
            onClick={() => dismiss(true)}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            Skip — I&apos;ll do this later
          </button>
          <button
            type="button"
            onClick={() => dismiss(true)}
            disabled={!bothDone && !pwaDone && !shortcutDone}
            className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2 className="size-3.5" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  iconColor,
  title,
  desc,
  done,
  busy,
  ctaLabel,
  disabled,
  onClick,
}: {
  icon: typeof AppWindow;
  iconColor: string;
  title: string;
  desc: string;
  done: boolean;
  busy?: boolean;
  ctaLabel: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
      <Icon className={`mt-0.5 size-4 shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-foreground">{title}</div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
          {desc}
        </p>
      </div>
      {done ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
          <CheckCircle2 className="size-3" /> Done
        </span>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-1.5 rounded bg-primary px-2.5 py-1 text-[12px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="size-3.5 animate-spin" />}
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
