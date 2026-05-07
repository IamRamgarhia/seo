"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bot, Loader2, Play } from "lucide-react";
import { startAiAudit, type StartState } from "./actions";

export function RunForm({
  clientId,
  defaultUrl,
}: {
  clientId: number;
  defaultUrl: string;
}) {
  const [state, formAction, pending] = useActionState<
    StartState | null,
    FormData
  >(startAiAudit, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      router.push(`/clients/${clientId}/ai-audit/${state.auditId}`);
    }
  }, [state, clientId, router]);

  return (
    <form
      action={formAction}
      className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3"
    >
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <input
          name="url"
          required
          defaultValue={defaultUrl}
          placeholder="https://yoursite.com/page-to-audit"
          className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center rounded-md bg-violet-500/15 px-5 text-sm font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30 hover:bg-violet-500/25 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Auditing… (1-2 min)
            </>
          ) : (
            <>
              <Bot className="mr-2 size-4" />
              <Play className="mr-2 size-3" />
              Run AI audit
            </>
          )}
        </button>
      </div>
      {state && !state.ok && (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-xs text-rose-300 ring-1 ring-inset ring-rose-500/30">
          {state.error}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        Visits the URL, runs every check, AI writes fix steps for each
        failing one. Reuses your active AI provider — text-only models work
        fine for this; vision is not required.
      </p>
    </form>
  );
}
