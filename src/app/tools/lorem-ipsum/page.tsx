"use client";

import { useMemo, useState } from "react";
import { FileText, Copy } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";

const WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum"
    .split(" ");

function pickWord(seed: { i: number }): string {
  const w = WORDS[seed.i % WORDS.length];
  seed.i = (seed.i * 1103515245 + 12345) & 0x7fffffff;
  return w;
}

function makeSentence(seed: { i: number }): string {
  const len = 7 + (seed.i % 12);
  const words: string[] = [];
  for (let j = 0; j < len; j++) words.push(pickWord(seed));
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

function makeParagraph(seed: { i: number }): string {
  const sentences = 3 + (seed.i % 4);
  const out: string[] = [];
  for (let j = 0; j < sentences; j++) out.push(makeSentence(seed));
  return out.join(" ");
}

export default function LoremIpsumPage() {
  const [unit, setUnit] = useState<"paragraphs" | "sentences" | "words">(
    "paragraphs",
  );
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);

  const text = useMemo(() => {
    const seed = { i: 12345 };
    let out = "";
    if (unit === "words") {
      const words: string[] = [];
      if (startWithLorem) words.push("Lorem", "ipsum");
      while (words.length < count) words.push(pickWord(seed));
      out = words.slice(0, count).join(" ") + ".";
    } else if (unit === "sentences") {
      const sentences: string[] = [];
      for (let i = 0; i < count; i++) sentences.push(makeSentence(seed));
      if (startWithLorem)
        sentences[0] = "Lorem ipsum dolor sit amet, " + sentences[0].toLowerCase();
      out = sentences.join(" ");
    } else {
      const paras: string[] = [];
      for (let i = 0; i < count; i++) paras.push(makeParagraph(seed));
      if (startWithLorem)
        paras[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + paras[0];
      out = paras.join("\n\n");
    }
    return out;
  }, [unit, count, startWithLorem]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Lorem ipsum generator"
        description="Generate placeholder text in paragraphs, sentences, or words."
        icon={FileText}
        accent="cyan"
      />
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/5 bg-card/40 p-4">
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Unit</span>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
            className="h-9 rounded-md border border-white/10 bg-card/60 px-3 text-sm"
          >
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-muted-foreground">Count</span>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="h-9 w-24 rounded-md border border-white/10 bg-card/60 px-3 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(e) => setStartWithLorem(e.target.checked)}
          />
          Start with &quot;Lorem ipsum…&quot;
        </label>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(text)}
          className="inline-flex h-9 items-center gap-1 rounded-md bg-emerald-500/15 px-3 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/25"
        >
          <Copy className="size-3.5" />
          Copy
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-5 text-sm leading-relaxed">
        {text}
      </pre>
    </div>
  );
}
