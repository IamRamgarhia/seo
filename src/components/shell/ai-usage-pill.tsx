import Link from "next/link";
import { Activity } from "lucide-react";
import { gte, sum } from "drizzle-orm";
import { db } from "@/db/client";
import { aiCalls } from "@/db/schema";
import { microsToDisplay } from "@/lib/ai-cost";
import { checkMonthlyCap } from "@/lib/ai-usage";

/**
 * Tiny topbar pill: today's AI calls + ≈ cost. Visible on every page so users
 * never wonder "where is my budget going". Clicks through to /settings/ai-usage.
 *
 * Hidden when no AI calls have ever been logged — keeps the topbar clean for
 * users who haven't configured an AI provider yet.
 */
export async function AiUsagePill() {
  let todayCount = 0;
  let todayMicros = 0;
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const [row] = await db
      .select({ count: sum(aiCalls.totalTokens), cost: sum(aiCalls.costMicros) })
      .from(aiCalls)
      .where(gte(aiCalls.createdAt, today));
    todayCount = Number(row?.count ?? 0);
    todayMicros = Number(row?.cost ?? 0);
  } catch {
    return null;
  }

  // Also surface cap status — show as warning if >70% used
  let capWarning = false;
  let capPct: number | null = null;
  try {
    const cap = await checkMonthlyCap();
    if (cap.capUsd && cap.capUsd > 0) {
      capPct = (cap.spentUsd / cap.capUsd) * 100;
      if (capPct >= 70) capWarning = true;
    }
  } catch {
    // ignore
  }

  // Keep the pill quiet on a dead workspace — only show after first call
  if (todayCount === 0 && (capPct ?? 0) === 0) return null;

  const tone = capWarning
    ? "bg-amber-500/15 text-amber-300 ring-amber-500/30"
    : "bg-violet-500/10 text-violet-200 ring-violet-500/25";

  return (
    <Link
      href="/settings/ai-usage"
      title={
        capPct !== null
          ? `Today: ${microsToDisplay(todayMicros)} · monthly cap ${capPct.toFixed(0)}% used`
          : `Today's AI usage`
      }
      className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1 ring-inset ${tone}`}
    >
      <Activity className="size-3" />
      <span className="tabular-nums">
        {microsToDisplay(todayMicros)}
        {capPct !== null && (
          <span className="ml-1 text-[10px] opacity-75">
            · {capPct.toFixed(0)}%
          </span>
        )}
      </span>
    </Link>
  );
}
