"use client";

import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";
import {
  MODEL_PRESETS,
  PROVIDER_LABEL,
  defaultModelFor,
} from "@/lib/ai-model-presets";
import type { ActiveProvider } from "@/lib/api-keys";
import { listConfiguredProviders } from "@/app/api/ai-providers/actions";

export type ModelSelection = {
  /** undefined = use the workspace's active provider. */
  provider: ActiveProvider | undefined;
  /** undefined = use the provider's default model. */
  model: string | undefined;
};

/**
 * Compact dropdown for choosing which provider + model to use for the next
 * AI call. When the user only has 0-1 providers configured, the picker
 * collapses (nothing useful to choose) — to enable, configure another key
 * in Settings.
 *
 * Does not call any AI itself — only emits selection changes via onChange.
 * Caller is responsible for forwarding `provider` and `model` to whatever
 * server action invokes callAI(), as `providerOverride` + `modelOverride`.
 */
export function AiModelPicker({
  selection,
  onChange,
  size = "md",
}: {
  selection: ModelSelection;
  onChange: (s: ModelSelection) => void;
  size?: "sm" | "md";
}) {
  const [configured, setConfigured] = useState<ActiveProvider[]>([]);
  const [active, setActive] = useState<ActiveProvider | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listConfiguredProviders().then((r) => {
      setConfigured(r.configured);
      setActive(r.active);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  // Only show if there's an actual choice
  if (configured.length <= 1) return null;

  const effectiveProvider = selection.provider ?? active ?? configured[0];
  const presets = MODEL_PRESETS[effectiveProvider] ?? [];
  const effectiveModel =
    selection.model ?? defaultModelFor(effectiveProvider);

  const cls =
    size === "sm"
      ? "h-7 text-[11px]"
      : "h-8 text-xs";

  function pickProvider(p: ActiveProvider) {
    // When provider changes, reset to that provider's default model
    onChange({ provider: p, model: defaultModelFor(p) });
  }
  function pickModel(m: string) {
    onChange({ provider: effectiveProvider, model: m });
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <Cpu
        className={
          size === "sm" ? "size-3 text-violet-300" : "size-3.5 text-violet-300"
        }
      />
      <select
        value={effectiveProvider}
        onChange={(e) => pickProvider(e.target.value as ActiveProvider)}
        className={`${cls} rounded-md border border-white/10 bg-card/60 px-1.5 focus:outline-none focus:ring-1 focus:ring-ring/40`}
        title="AI provider"
      >
        {configured.map((p) => (
          <option key={p} value={p}>
            {PROVIDER_LABEL[p]}
            {p === active ? " (default)" : ""}
          </option>
        ))}
      </select>
      {presets.length > 0 && (
        <select
          value={effectiveModel}
          onChange={(e) => pickModel(e.target.value)}
          className={`${cls} max-w-[200px] truncate rounded-md border border-white/10 bg-card/60 px-1.5 focus:outline-none focus:ring-1 focus:ring-ring/40`}
          title={
            presets.find((p) => p.id === effectiveModel)?.hint ?? "Model"
          }
        >
          {presets.map((m) => (
            <option key={m.id} value={m.id} title={m.hint}>
              {m.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
