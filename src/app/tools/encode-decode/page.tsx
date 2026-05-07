"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";

type Mode = "base64" | "url" | "html";
type Direction = "encode" | "decode";

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function encodeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c] ?? c);
}

function decodeHtml(s: string): string {
  if (typeof document === "undefined") return s;
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

function transform(input: string, mode: Mode, dir: Direction): string {
  if (!input) return "";
  try {
    if (mode === "base64") {
      if (dir === "encode") {
        return btoa(unescape(encodeURIComponent(input)));
      }
      return decodeURIComponent(escape(atob(input)));
    }
    if (mode === "url") {
      return dir === "encode"
        ? encodeURIComponent(input)
        : decodeURIComponent(input);
    }
    return dir === "encode" ? encodeHtml(input) : decodeHtml(input);
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : "transform failed"}`;
  }
}

export default function EncodeDecodePage() {
  const [mode, setMode] = useState<Mode>("base64");
  const [dir, setDir] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const output = transform(input, mode, dir);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Encode / Decode"
        description="Base64, URL-encoding (percent-encoding), and HTML-entity encoding all in one. Pure local."
        icon={Lock}
        accent="cyan"
      />
      <div className="flex flex-wrap gap-2">
        {(["base64", "url", "html"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={pill(mode === m)}
          >
            {m}
          </button>
        ))}
        <span className="mx-2 self-center text-muted-foreground">·</span>
        {(["encode", "decode"] as Direction[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDir(d)}
            className={pill(dir === d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={20}
          placeholder={dir === "encode" ? "Plain text to encode…" : "Encoded text to decode…"}
          className="w-full rounded-2xl border border-white/10 bg-card/60 p-4 font-mono text-[12px] focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <textarea
          value={output}
          readOnly
          rows={20}
          className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-[12px]"
        />
      </div>
      <button
        type="button"
        disabled={!output}
        onClick={() => navigator.clipboard.writeText(output)}
        className="inline-flex h-9 items-center rounded-md bg-emerald-500/15 px-3 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50"
      >
        Copy output
      </button>
    </div>
  );
}

function pill(active: boolean): string {
  return `rounded-full px-3 py-1 text-xs ring-1 ring-inset transition-colors ${
    active
      ? "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30"
      : "bg-white/5 text-muted-foreground ring-white/10 hover:bg-white/10"
  }`;
}
