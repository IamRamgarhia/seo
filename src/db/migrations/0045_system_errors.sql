CREATE TABLE IF NOT EXISTS system_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL CHECK (source IN ('server', 'client', 'worker')),
  context TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  occurrences INTEGER NOT NULL DEFAULT 1,
  first_seen_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at INTEGER NOT NULL DEFAULT (unixepoch()),
  resolved INTEGER NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS system_errors_last_seen_idx ON system_errors(last_seen_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS system_errors_resolved_idx ON system_errors(resolved, last_seen_at DESC);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS system_errors_dedupe_idx ON system_errors(source, context, message);
