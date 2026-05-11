CREATE TABLE IF NOT EXISTS manual_report_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  /* "backlink" | "outreach" | "comment" | "social_post" | "review" | "milestone" | "note" */
  kind TEXT NOT NULL,
  /* Free-form title (e.g. "Got featured on Forbes") */
  title TEXT NOT NULL,
  /* Optional URL evidence */
  url TEXT,
  /* Optional structured detail (JSON: anchor text, do/nofollow, da estimate, etc.) */
  details TEXT,
  /* When the work happened (user-set; not the row creation time). */
  happened_at INTEGER,
  /* Auto-detected during paste — text that doesn't fit becomes notes. */
  raw_text TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS manual_report_data_client_idx
  ON manual_report_data(client_id, happened_at DESC);
