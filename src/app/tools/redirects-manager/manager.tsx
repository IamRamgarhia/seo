"use client";

import { useState, useTransition } from "react";
import { CornerDownRight, Plus, Trash2 } from "lucide-react";
import {
  addRule,
  deleteRule,
  deleteNotFound,
  resolve404,
} from "./actions";
import type { RedirectRule, NotFoundLog } from "@/db/schema";

export function Manager({
  rules,
  notFound,
}: {
  rules: RedirectRule[];
  notFound: NotFoundLog[];
}) {
  const [, startMut] = useTransition();
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [resolveTarget, setResolveTarget] = useState("");
  const [tab, setTab] = useState<"rules" | "404">("rules");

  return (
    <>
      <div className="flex flex-wrap gap-2 border-b border-white/[0.06]">
        {(["rules", "404"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              tab === t
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "rules" ? `Redirect rules (${rules.length})` : `404 log (${notFound.filter((n) => !n.resolved).length})`}
          </button>
        ))}
      </div>

      {tab === "rules" && (
        <>
          <form
            action={async (fd) => {
              await addRule(fd);
            }}
            className="glass-apple relative overflow-hidden rounded-2xl p-5 space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
              <input
                name="sourcePath"
                required
                placeholder="/old-path"
                className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <input
                name="targetUrl"
                required
                placeholder="/new-path or https://example.com/new"
                className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <select
                name="statusCode"
                defaultValue={301}
                className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm"
              >
                <option value={301}>301 (permanent)</option>
                <option value={302}>302 (temporary)</option>
                <option value={307}>307 (temp, preserve method)</option>
                <option value={308}>308 (perm, preserve method)</option>
                <option value={410}>410 (gone)</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_140px]">
              <input
                name="note"
                placeholder="Note (optional)"
                className="h-9 w-full rounded-md border border-white/10 bg-card/60 px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-md bg-amber-500/15 px-4 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/25"
              >
                <Plus className="mr-2 size-3" />
                Add rule
              </button>
            </div>
          </form>

          {rules.length === 0 ? (
            <p className="rounded-md bg-white/[0.02] px-3 py-2 text-sm text-muted-foreground">
              No redirect rules yet.
            </p>
          ) : (
            <section className="glass-apple relative overflow-hidden rounded-2xl">
              <ul className="divide-y divide-white/[0.05]">
                {rules.map((r) => (
                  <li
                    key={r.id}
                    className="grid grid-cols-[100px_1fr_auto_auto] gap-3 px-5 py-2 text-xs"
                  >
                    <span className="text-amber-300 tabular-nums">{r.statusCode}</span>
                    <div className="min-w-0">
                      <code className="truncate">{r.sourcePath}</code>
                      <CornerDownRight className="mx-1 inline size-3 text-muted-foreground" />
                      <code className="truncate text-muted-foreground">{r.targetUrl}</code>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {r.note ?? ""}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        startMut(async () => {
                          await deleteRule(r.id);
                        })
                      }
                      className="inline-flex h-6 items-center rounded-md bg-rose-500/10 px-2 text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-rose-500/20"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-[10px] text-muted-foreground">
            Export rules to your server as Nginx / Apache / Next.js blocks via
            the Migration Map tool. This page is the source of truth.
          </p>
        </>
      )}

      {tab === "404" && (
        <>
          {notFound.length === 0 ? (
            <p className="rounded-md bg-white/[0.02] px-3 py-2 text-sm text-muted-foreground">
              No 404s logged. POST{" "}
              <code className="rounded bg-white/5 px-1 py-0.5">
                {"{ sourcePath: '/path' }"}
              </code>{" "}
              from your site to{" "}
              <code className="rounded bg-white/5 px-1 py-0.5">
                /api/v1/track-404
              </code>{" "}
              to log automatically.
            </p>
          ) : (
            <section className="glass-apple relative overflow-hidden rounded-2xl">
              <ul className="divide-y divide-white/[0.05]">
                {notFound.map((n) => (
                  <li
                    key={n.id}
                    className={`px-5 py-2 text-xs ${n.resolved ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <code className="truncate font-medium">{n.sourcePath}</code>
                      <span className="text-muted-foreground tabular-nums">
                        {n.hits} hit{n.hits === 1 ? "" : "s"} · last{" "}
                        {n.lastSeen.toLocaleDateString()}
                      </span>
                      {!n.resolved && (
                        <button
                          type="button"
                          onClick={() =>
                            setResolveId(resolveId === n.id ? null : n.id)
                          }
                          className="inline-flex h-7 items-center rounded-md bg-amber-500/15 px-2 text-amber-300 ring-1 ring-inset ring-amber-500/30 hover:bg-amber-500/25"
                        >
                          Resolve
                        </button>
                      )}
                      {n.resolved && n.resolvedToUrl && (
                        <span className="text-[10px] text-emerald-300 truncate max-w-[40%]">
                          ✓ → {n.resolvedToUrl}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          startMut(async () => {
                            await deleteNotFound(n.id);
                          })
                        }
                        className="inline-flex h-6 items-center rounded-md bg-rose-500/10 px-2 text-rose-300 ring-1 ring-inset ring-rose-500/30 hover:bg-rose-500/20"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    {resolveId === n.id && (
                      <form
                        action={async (fd) => {
                          fd.set("id", String(n.id));
                          fd.set("targetUrl", resolveTarget);
                          await resolve404(fd);
                          setResolveId(null);
                          setResolveTarget("");
                        }}
                        className="mt-2 flex items-center gap-2"
                      >
                        <input
                          value={resolveTarget}
                          onChange={(e) => setResolveTarget(e.target.value)}
                          placeholder="Redirect to URL or path"
                          className="h-7 flex-1 rounded-md border border-white/10 bg-card/60 px-2 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={!resolveTarget.trim()}
                          className="inline-flex h-7 items-center rounded-md bg-emerald-500/15 px-3 text-emerald-300 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          Create 301
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
