"use client";

import { useState, useMemo } from "react";
import { ScanText } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";

export default function WordCounterPage() {
  const [text, setText] = useState("");
  const stats = useMemo(() => {
    const t = text;
    const trimmed = t.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = t.length;
    const charsNoSpaces = t.replace(/\s/g, "").length;
    const sentences = trimmed
      ? (trimmed.match(/[.!?]+(?:\s|$)/g)?.length ?? 0) || 1
      : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).length : 0;
    const readingTimeMin = Math.max(1, Math.round(words / 200));
    const longestWord = trimmed
      ? trimmed
          .split(/\s+/)
          .reduce((a, b) => (a.length >= b.length ? a : b), "")
      : "";
    // Title-case keyword density (top 5)
    const wordCounts = new Map<string, number>();
    if (trimmed) {
      for (const w of trimmed.toLowerCase().split(/\W+/)) {
        if (!w || w.length < 3 || STOPWORDS.has(w)) continue;
        wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
      }
    }
    const top = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([w, n]) => ({
        word: w,
        count: n,
        density: words ? (n / words) * 100 : 0,
      }));
    return {
      words,
      chars,
      charsNoSpaces,
      sentences,
      paragraphs,
      readingTimeMin,
      longestWord,
      top,
    };
  }, [text]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Word counter"
        description="Live word, character, sentence, paragraph, reading-time and keyword-density stats. All calculated locally — your text never leaves the browser."
        icon={ScanText}
        accent="cyan"
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={20}
          placeholder="Paste or type your content here…"
          className="w-full rounded-2xl border border-white/10 bg-card/60 p-4 font-sans text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <aside className="space-y-3">
          <Stat label="Words" value={stats.words} />
          <Stat label="Characters" value={stats.chars} />
          <Stat label="Characters (no spaces)" value={stats.charsNoSpaces} />
          <Stat label="Sentences" value={stats.sentences} />
          <Stat label="Paragraphs" value={stats.paragraphs} />
          <Stat
            label="Reading time"
            value={`${stats.readingTimeMin} min`}
            hint="@ 200 wpm"
          />
          {stats.longestWord && (
            <Stat label="Longest word" value={stats.longestWord} />
          )}
          {stats.top.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-black/20 p-3 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Top keywords
              </p>
              <ul className="mt-2 space-y-1">
                {stats.top.map((k) => (
                  <li
                    key={k.word}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{k.word}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {k.count} · {k.density.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

const STOPWORDS = new Set([
  "the","and","for","are","but","not","you","all","can","her","was","one","our",
  "out","day","get","has","him","his","how","man","new","now","old","see","two",
  "way","who","boy","did","its","let","put","say","she","too","use","this","that",
  "with","have","from","they","will","what","were","when","your","there","their",
  "would","could","about","which","because","into","than","then","them","these",
  "those","being","does","just","like","more","over","such","also","very","much",
  "some","most","many","each","also","still","yet","ever","while","upon",
]);
