"use client";

import { useState } from "react";
import { Type, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";

const TRANSFORMS: { label: string; fn: (s: string) => string }[] = [
  { label: "UPPERCASE", fn: (s) => s.toUpperCase() },
  { label: "lowercase", fn: (s) => s.toLowerCase() },
  {
    label: "Title Case",
    fn: (s) =>
      s
        .toLowerCase()
        .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1)),
  },
  {
    label: "Sentence case",
    fn: (s) =>
      s
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()),
  },
  { label: "kebab-case", fn: (s) => s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") },
  { label: "snake_case", fn: (s) => s.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]/g, "") },
  {
    label: "camelCase",
    fn: (s) =>
      s
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase()),
  },
  {
    label: "PascalCase",
    fn: (s) => {
      const cc = s
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase());
      return cc.charAt(0).toUpperCase() + cc.slice(1);
    },
  },
  {
    label: "iNVERSE cASE",
    fn: (s) =>
      s
        .split("")
        .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
        .join(""),
  },
  { label: "Reverse", fn: (s) => s.split("").reverse().join("") },
];

export default function CaseConverterPage() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  function copy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Case converter"
        description="Convert text between every common case style. Pure local — nothing leaves the browser."
        icon={Type}
        accent="cyan"
      />
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={5}
        placeholder="Paste or type your text…"
        className="w-full rounded-2xl border border-white/10 bg-card/60 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {TRANSFORMS.map((t, i) => {
          const out = t.fn(input);
          return (
            <div
              key={t.label}
              className="rounded-xl border border-white/5 bg-card/40 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </span>
                <button
                  type="button"
                  onClick={() => copy(out, i)}
                  disabled={!out}
                  className="inline-flex h-6 items-center gap-1 rounded-md bg-white/5 px-2 text-[10px] text-muted-foreground hover:bg-white/10 disabled:opacity-50"
                >
                  {copied === i ? (
                    <>
                      <Check className="size-3 text-emerald-300" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1.5 break-all text-sm">{out || <span className="text-muted-foreground">—</span>}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
