"use client";

/**
 * Shown when the user clicked "Generate report" but workspace branding
 * (name + logo) isn't filled in. Renders inline at the top of the client
 * page when ?branding-needed=1 is in the URL.
 *
 * Two paths out:
 *   - Set branding now → /settings#brand (returns here with the param)
 *   - Skip for this client → POST /api/clients/{id}/skip-branding, then
 *     re-trigger the report download for the original template.
 *
 * Once dismissed in either direction, the banner won't re-appear for
 * this client (branding_skipped flag persists in DB).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Palette, X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { safeFetch } from "@/lib/safe-fetch";

type Props = {
  clientId: number;
  /** The report template the user originally clicked (e.g. "executive"). */
  template: string;
};

export function BrandingPreflightBanner({ clientId, template }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  async function skipForThisClient() {
    setBusy(true);
    const r = await safeFetch<{ ok: boolean }>(
      `/api/clients/${clientId}/skip-branding`,
      { method: "POST" },
    );
    if (!r.ok) {
      toast.error("Couldn't save the preference", { description: r.error });
      setBusy(false);
      return;
    }
    toast.success("Branding skipped for this client", {
      description: "Generating report now…",
    });
    // Trigger the original report download in a new tab so the user
    // doesn't lose context. The route now skips the pre-flight check.
    window.open(`/reports/${clientId}?template=${template}`, "_blank");
    setDismissed(true);
    router.refresh();
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100 shadow">
      <Palette className="mt-0.5 size-5 shrink-0 text-amber-300" />
      <div className="flex-1 space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-amber-200">
            Set your branding before generating reports
          </h3>
          <p className="mt-0.5 text-xs text-amber-100/80">
            Your reports will have your name + logo on the cover, replacing
            ours. Takes 30 seconds. Or skip and generate plain reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/settings?brand-return=${clientId}&template=${template}#brand`}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/25 px-3 py-1.5 text-xs font-medium text-amber-100 ring-1 ring-inset ring-amber-500/40 hover:bg-amber-500/35"
          >
            <Palette className="size-3.5" />
            Set branding now
          </Link>
          <button
            type="button"
            onClick={skipForThisClient}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-transparent px-3 py-1.5 text-xs text-amber-200 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            Generate without branding
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="grid size-6 shrink-0 place-items-center rounded text-amber-300/70 transition-colors hover:bg-amber-500/15 hover:text-amber-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
