"use client";

/**
 * Tremor-powered per-row rank trend. Replaces the hand-rolled SVG
 * polyline with a SparkAreaChart that has a gradient fill, smoother
 * curves, and consistent styling across the app.
 *
 * Position semantics are inverted (lower position = better rank), so
 * the chart plots `100 - position` to keep the natural "up = better"
 * direction. The numbers themselves never render — this is a trend
 * indicator, not a reading.
 */

import { SparkAreaChart } from "@tremor/react";

type Point = {
  checkedAt: Date;
  position: number | null;
};

export function RankSparkline({ history }: { history: Point[] }) {
  const filtered = history.filter(
    (h): h is Point & { position: number } => h.position !== null,
  );
  if (filtered.length < 2) {
    return (
      <span className="text-[11px] text-muted-foreground/50">
        Needs ≥2 checks
      </span>
    );
  }

  const data = filtered.map((p) => ({
    t: p.checkedAt.toISOString().slice(5, 10),
    rank: 100 - p.position,
  }));

  const first = filtered[0].position;
  const last = filtered[filtered.length - 1].position;
  // Lower position is better — invert for direction
  const color: "emerald" | "rose" | "gray" =
    last < first ? "emerald" : last > first ? "rose" : "gray";

  return (
    <SparkAreaChart
      data={data}
      categories={["rank"]}
      index="t"
      colors={[color]}
      className="h-6 w-24"
      showGradient
      autoMinValue
    />
  );
}
