-- Per-finding tracking for AI tools (SXO, GEO, E-E-A-T, AI site audit, etc.).
-- Each row is one actionable item the user can mark complete one-by-one.
--
-- Backed by a single shared table so every tool gets the same checklist UX:
--   - title + details (what's wrong)
--   - fix_steps (numbered plain-English steps)
--   - code_snippet (HTML / JSON-LD / robots.txt — null when N/A)
--   - status workflow: new → in_progress → resolved / ignored
--   - re-check flow can resolve findings automatically when they no longer
--     appear in the latest run for the same (clientId, toolId, signature)

CREATE TABLE IF NOT EXISTS tool_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL REFERENCES tool_runs(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  /** Stable identifier within a tool: "sxo.page_promise.no_h1", "geo.tldr.missing", etc.
      Used by re-check to match findings across runs for the same URL / page. */
  signature TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low','pass')),
  details TEXT,
  fix_steps TEXT,
  code_snippet TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','resolved','ignored')),
  completed_at INTEGER,
  completed_note TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tool_findings_run_idx ON tool_findings (run_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tool_findings_client_idx ON tool_findings (client_id, tool_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tool_findings_signature_idx ON tool_findings (client_id, tool_id, signature);

--> statement-breakpoint
-- Per-client opt-out for the branding pre-flight on report generation.
-- When TRUE, the report generator no longer prompts the user to fill in
-- brand.name / brand.logo / brand.color before producing a PDF.
ALTER TABLE clients ADD COLUMN branding_skipped INTEGER NOT NULL DEFAULT 0;
