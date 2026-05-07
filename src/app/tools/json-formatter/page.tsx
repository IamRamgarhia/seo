"use client";

import { useMemo, useState } from "react";
import { Braces, Check, Copy } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState<"pretty" | "minified" | null>(null);

  const result = useMemo(() => {
    if (!input.trim())
      return { ok: true as const, pretty: "", minified: "", size: 0 };
    try {
      const parsed = JSON.parse(input);
      return {
        ok: true as const,
        pretty: JSON.stringify(parsed, null, indent),
        minified: JSON.stringify(parsed),
        size: new Blob([input]).size,
      };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Invalid JSON",
      };
    }
  }, [input, indent]);

  function copy(text: string, kind: "pretty" | "minified") {
    navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="JSON formatter / validator / minifier"
        description="Paste JSON, get a pretty-printed and a minified copy with size diff. Validation runs locally in the browser."
        icon={Braces}
        accent="cyan"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Input</span>
            <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
              Indent:
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                className="h-6 rounded-md border border-white/10 bg-card/60 px-2 text-[11px]"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={1}>tab (1)</option>
              </select>
            </label>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={24}
            placeholder='{"hello": "world"}'
            className="w-full rounded-2xl border border-white/10 bg-card/60 p-4 font-mono text-[12px] focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="space-y-2">
          {result.ok ? (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300">
                  Valid JSON · {result.size} bytes
                </span>
                <button
                  type="button"
                  onClick={() => copy(result.pretty, "pretty")}
                  disabled={!result.pretty}
                  className="inline-flex h-6 items-center gap-1 rounded-md bg-white/5 px-2 text-[10px] text-muted-foreground hover:bg-white/10 disabled:opacity-50"
                >
                  {copied === "pretty" ? (
                    <Check className="size-3 text-emerald-300" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  Copy pretty
                </button>
              </div>
              <pre className="max-h-[40vh] overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-[12px]">
                {result.pretty || "(empty)"}
              </pre>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Minified · {result.minified.length} bytes (
                  {result.size > 0
                    ? Math.round(
                        ((result.size - result.minified.length) /
                          result.size) *
                          100,
                      )
                    : 0}
                  % smaller)
                </span>
                <button
                  type="button"
                  onClick={() => copy(result.minified, "minified")}
                  disabled={!result.minified}
                  className="inline-flex h-6 items-center gap-1 rounded-md bg-white/5 px-2 text-[10px] text-muted-foreground hover:bg-white/10 disabled:opacity-50"
                >
                  {copied === "minified" ? (
                    <Check className="size-3 text-emerald-300" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  Copy minified
                </button>
              </div>
              <pre className="max-h-32 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-[12px]">
                {result.minified || "(empty)"}
              </pre>
            </>
          ) : (
            <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
              ✗ {result.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
