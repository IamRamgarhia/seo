"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, RefreshCw, Copy } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/|~",
};

function generate(opts: {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}): string {
  let pool = "";
  if (opts.lower) pool += SETS.lower;
  if (opts.upper) pool += SETS.upper;
  if (opts.digits) pool += SETS.digits;
  if (opts.symbols) pool += SETS.symbols;
  if (opts.excludeAmbiguous) pool = pool.replace(/[Il1O0]/g, "");
  if (!pool) return "";
  const arr = new Uint32Array(opts.length);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < opts.length; i++) out += pool[arr[i] % pool.length];
  return out;
}

function strength(pwd: string): {
  label: string;
  tone: "rose" | "amber" | "emerald";
  bits: number;
} {
  if (!pwd) return { label: "—", tone: "rose", bits: 0 };
  let pool = 0;
  if (/[a-z]/.test(pwd)) pool += 26;
  if (/[A-Z]/.test(pwd)) pool += 26;
  if (/[0-9]/.test(pwd)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) pool += 32;
  const bits = pool > 0 ? pwd.length * Math.log2(pool) : 0;
  if (bits < 50) return { label: "Weak", tone: "rose", bits };
  if (bits < 80) return { label: "OK", tone: "amber", bits };
  return { label: "Strong", tone: "emerald", bits };
}

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(20);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);

  const pwd = useMemo(
    () =>
      generate({ length, lower, upper, digits, symbols, excludeAmbiguous }),
    // re-roll on seed bump too
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [length, lower, upper, digits, symbols, excludeAmbiguous, seed],
  );
  useEffect(() => {
    setCopied(false);
  }, [pwd]);

  const s = strength(pwd);
  const tone = {
    rose: "text-rose-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
  }[s.tone];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Password generator"
        description="Cryptographically random passwords using crypto.getRandomValues. Tune length, character classes, and exclude ambiguous characters."
        icon={KeyRound}
        accent="cyan"
      />
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-center font-mono text-2xl tracking-wider">
        {pwd || "(adjust options)"}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className={`${tone} font-semibold`}>{s.label}</span>
        <span className="text-muted-foreground">
          ~{Math.round(s.bits)} bits of entropy
        </span>
        <span className="mx-2 text-muted-foreground">·</span>
        <button
          type="button"
          onClick={() => setSeed((x) => x + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-cyan-500/15 px-3 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/30 hover:bg-cyan-500/25"
        >
          <RefreshCw className="size-3" />
          Re-roll
        </button>
        <button
          type="button"
          disabled={!pwd}
          onClick={() => {
            navigator.clipboard.writeText(pwd);
            setCopied(true);
          }}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-emerald-500/15 px-3 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50"
        >
          <Copy className="size-3" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card/40 p-5 space-y-4">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">
            Length: <strong className="text-foreground">{length}</strong>
          </span>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="block w-full"
          />
        </label>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <Toggle label="Lowercase" checked={lower} onChange={setLower} />
          <Toggle label="Uppercase" checked={upper} onChange={setUpper} />
          <Toggle label="Digits" checked={digits} onChange={setDigits} />
          <Toggle label="Symbols" checked={symbols} onChange={setSymbols} />
          <Toggle
            label="Exclude ambiguous (0/O/1/l/I)"
            checked={excludeAmbiguous}
            onChange={setExcludeAmbiguous}
          />
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md bg-white/[0.03] px-3 py-2 text-xs">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
