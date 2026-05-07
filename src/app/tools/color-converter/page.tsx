"use client";

import { useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").trim();
  if (m.length === 3) {
    const r = parseInt(m[0] + m[0], 16);
    const g = parseInt(m[1] + m[1], 16);
    const b = parseInt(m[2] + m[2], 16);
    if (Number.isNaN(r)) return null;
    return [r, g, b];
  }
  if (m.length === 6) {
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((n) => Math.max(0, Math.min(255, Math.round(n))))
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      default:
        h = ((r - g) / d + 4) * 60;
    }
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function rgbToCmyk(
  r: number,
  g: number,
  b: number,
): [number, number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return [0, 0, 0, 100];
  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);
  return [
    Math.round(c * 100),
    Math.round(m * 100),
    Math.round(y * 100),
    Math.round(k * 100),
  ];
}

function relLum([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const la = relLum(a);
  const lb = relLum(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function ColorConverterPage() {
  const [hex, setHex] = useState("#7c3aed");
  const rgb = useMemo(() => hexToRgb(hex), [hex]);

  if (!rgb) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Color converter"
          description="Convert between HEX / RGB / HSL / CMYK and check WCAG contrast against white and black."
          icon={Palette}
          accent="cyan"
        />
        <input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          placeholder="#hex"
          className="h-10 w-full rounded-md border border-white/10 bg-card/60 px-3 font-mono text-sm"
        />
        <p className="text-xs text-rose-300">Invalid hex color.</p>
      </div>
    );
  }

  const [r, g, b] = rgb;
  const [h, s, l] = rgbToHsl(r, g, b);
  const [c, m, y, k] = rgbToCmyk(r, g, b);
  const cWhite = contrastRatio(rgb, [255, 255, 255]);
  const cBlack = contrastRatio(rgb, [0, 0, 0]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Color converter"
        description="Convert between HEX / RGB / HSL / CMYK and check WCAG contrast against white and black."
        icon={Palette}
        accent="cyan"
      />
      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <div
          className="grid h-32 place-items-center rounded-2xl text-center text-sm font-medium ring-1 ring-inset ring-white/10"
          style={{ background: rgbToHex(r, g, b), color: cWhite > cBlack ? "#fff" : "#000" }}
        >
          {rgbToHex(r, g, b)}
        </div>
        <div className="space-y-3">
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">HEX</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={rgbToHex(r, g, b)}
                onChange={(e) => setHex(e.target.value)}
                className="h-9 w-12 rounded border border-white/10 bg-card/60"
              />
              <input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="h-9 flex-1 rounded-md border border-white/10 bg-card/60 px-3 font-mono text-sm"
              />
            </div>
          </label>
          <Row label="RGB" value={`rgb(${r}, ${g}, ${b})`} />
          <Row label="HSL" value={`hsl(${h}, ${s}%, ${l}%)`} />
          <Row label="CMYK" value={`cmyk(${c}%, ${m}%, ${y}%, ${k}%)`} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Contrast against="white" ratio={cWhite} />
        <Contrast against="black" ratio={cBlack} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-white/[0.04] px-3 py-2 text-sm">
      <span className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <code className="flex-1 font-mono">{value}</code>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(value)}
        className="text-[10px] text-muted-foreground hover:text-foreground"
      >
        Copy
      </button>
    </div>
  );
}

function Contrast({
  against,
  ratio,
}: {
  against: "white" | "black";
  ratio: number;
}) {
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3;
  const aaa = ratio >= 7;
  return (
    <div className="rounded-xl border border-white/5 bg-card/40 p-4 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">vs {against}</span>
        <span className="font-mono tabular-nums">{ratio.toFixed(2)} : 1</span>
      </div>
      <div className="mt-2 space-y-1">
        <Pass label="WCAG AA (normal)" pass={aaNormal} />
        <Pass label="WCAG AA (large)" pass={aaLarge} />
        <Pass label="WCAG AAA" pass={aaa} />
      </div>
    </div>
  );
}

function Pass({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div
      className={`flex items-center justify-between text-[11px] ${pass ? "text-emerald-300" : "text-rose-300"}`}
    >
      <span>{label}</span>
      <span>{pass ? "Pass" : "Fail"}</span>
    </div>
  );
}
