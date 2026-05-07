"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  saveBrowserSettings,
  type BrowserSettingsState,
} from "./browser-actions";

export function BrowserForm({
  initial,
}: {
  initial: { maxConcurrency: number; proxies: string; stealth: boolean };
}) {
  const [state, formAction, pending] = useActionState<
    BrowserSettingsState | null,
    FormData
  >(saveBrowserSettings, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[160px_1fr]">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Max concurrency</span>
          <input
            type="number"
            name="maxConcurrency"
            defaultValue={initial.maxConcurrency}
            min={1}
            max={16}
            className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <span className="block text-[10px] text-muted-foreground">
            How many browser contexts can run in parallel. Default 4.
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs">
          <input
            type="checkbox"
            name="stealth"
            defaultChecked={initial.stealth}
            className="mt-0.5 size-4"
          />
          <span>
            <span className="font-medium text-foreground">
              Stealth mode (recommended)
            </span>
            <span className="block text-muted-foreground">
              Hides headless-browser fingerprints — navigator.webdriver,
              plugins, languages, permissions API quirks. Reduces captcha
              triggers on Google + paywalled sites.
            </span>
          </span>
        </label>
      </div>

      <label className="block space-y-1 text-xs">
        <span className="text-muted-foreground">
          Outbound proxies (one per line — optional, rotated round-robin)
        </span>
        <textarea
          name="proxies"
          defaultValue={initial.proxies}
          rows={4}
          placeholder={
            "http://user:pass@proxy.example.com:8080\nhttp://10.0.0.5:3128\nsocks5://my-proxy:1080"
          }
          className="w-full rounded-md border border-white/10 bg-card/60 px-3 py-2 font-mono text-xs focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <span className="block text-[10px] text-muted-foreground">
          Leave empty for direct connection. With proxies set, every browser
          context gets the next one in the list. Supports{" "}
          <code>http://</code> and <code>socks5://</code> with optional
          user:pass.
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-md bg-violet-500/15 px-4 text-xs font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30 hover:bg-violet-500/25 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 size-3 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 size-3" />
              Save
            </>
          )}
        </button>
        {state?.ok && state.message && (
          <span className="text-xs text-emerald-300">{state.message}</span>
        )}
        {state && !state.ok && (
          <span className="text-xs text-rose-300">{state.error}</span>
        )}
      </div>
    </form>
  );
}
