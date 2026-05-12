"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Search, Wrench, X } from "lucide-react";
import {
  buildClientToolGroups,
  CLIENT_TOOL_NEEDS_HINTS,
  type ClientToolsClient,
} from "./client-tools-launcher";

/**
 * Per-client tool launcher as a secondary sidebar. Sits to the right of
 * the main shell sidebar and lists every tool pre-wired with this
 * client's URL / GSC / GBP / WP context. Sticky on the desktop so the
 * user can scroll the main content without losing the launcher.
 *
 * On narrow viewports it collapses to a button that opens a slide-down
 * panel — same data, no horizontal real estate cost.
 */
export function ClientToolsSidebar({
  client,
}: {
  client: ClientToolsClient;
}) {
  const groups = buildClientToolGroups(client);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  const q = query.trim().toLowerCase();
  const filteredGroups = q
    ? groups
        .map((g) => ({
          ...g,
          tools: g.tools.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.blurb.toLowerCase().includes(q),
          ),
        }))
        .filter((g) => g.tools.length > 0)
    : groups;

  const toolCount = groups.reduce((s, g) => s + g.tools.length, 0);

  function toggleGroup(label: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  // Inner list — re-used in both desktop sticky panel and mobile sheet
  const list = (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter tools…"
          className="h-8 w-full rounded-md border border-white/10 bg-card/60 pl-8 pr-2 text-xs focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="mt-2 space-y-3">
        {filteredGroups.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            No tools match &ldquo;{query}&rdquo;.
          </p>
        )}
        {filteredGroups.map((g) => {
          const collapsed = collapsedGroups.has(g.label);
          return (
            <div key={g.label}>
              <button
                type="button"
                onClick={() => toggleGroup(g.label)}
                className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left transition-colors hover:bg-white/[0.03]"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.label} · {g.tools.length}
                </span>
                <ChevronDown
                  className={`size-3 text-muted-foreground transition-transform ${
                    collapsed ? "-rotate-90" : ""
                  }`}
                />
              </button>
              {!collapsed && (
                <ul className="mt-1 space-y-0.5">
                  {g.tools.map((t) => {
                    const Icon = t.icon;
                    return (
                      <li key={t.href}>
                        <Link
                          href={t.href}
                          onClick={() => setMobileOpen(false)}
                          className="group flex items-start gap-2 rounded-md px-1.5 py-1.5 transition-colors hover:bg-white/[0.05]"
                        >
                          <Icon className="mt-0.5 size-3.5 shrink-0 text-violet-300" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-medium leading-tight group-hover:text-violet-200">
                              {t.title}
                            </span>
                            <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                              {t.blurb}
                            </span>
                            {t.needs && (
                              <span className="mt-0.5 inline-block max-w-full truncate rounded bg-amber-500/10 px-1 py-px text-[9px] text-amber-300 ring-1 ring-inset ring-amber-500/30">
                                {CLIENT_TOOL_NEEDS_HINTS[t.needs]}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: floating button that opens a sheet */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-violet-500/15 px-3 text-xs font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30 hover:bg-violet-500/25"
        >
          <Wrench className="size-3.5" />
          Tools for this client ({toolCount})
        </button>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto border-l border-white/10 bg-card p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Tools for this client
                </h3>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-white/10"
                >
                  <X className="size-4" />
                </button>
              </div>
              {list}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: sticky secondary sidebar */}
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 overflow-y-auto rounded-2xl border border-white/5 bg-card/40 p-3 backdrop-blur-md md:block">
        <header className="mb-3 px-1.5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Wrench className="size-3.5 text-violet-300" />
            Tools for this client
          </h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {toolCount} tools · pre-wired with this client&apos;s URL +
            connected accounts
          </p>
        </header>
        {list}
      </aside>
    </>
  );
}
