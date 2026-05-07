CREATE TABLE `serp_feature_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`keyword_id` integer,
	`query` text NOT NULL,
	`country` text NOT NULL DEFAULT 'US',
	`our_domain` text,
	`our_position` integer,
	`our_url` text,
	`has_aio` integer NOT NULL DEFAULT 0,
	`aio_sources` text,
	`aio_includes_us` integer NOT NULL DEFAULT 0,
	`has_featured_snippet` integer NOT NULL DEFAULT 0,
	`featured_url` text,
	`featured_owned_by_us` integer NOT NULL DEFAULT 0,
	`paa_questions` text,
	`top_results` text,
	`captured_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `serp_feature_snapshots_keyword_idx` ON `serp_feature_snapshots` (`keyword_id`);
--> statement-breakpoint
CREATE INDEX `serp_feature_snapshots_captured_at_idx` ON `serp_feature_snapshots` (`captured_at`);
--> statement-breakpoint
CREATE TABLE `robots_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer,
	`hostname` text NOT NULL,
	`content` text NOT NULL,
	`content_hash` text NOT NULL,
	`status` integer,
	`fetched_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `robots_snapshots_hostname_idx` ON `robots_snapshots` (`hostname`);
--> statement-breakpoint
CREATE INDEX `robots_snapshots_fetched_at_idx` ON `robots_snapshots` (`fetched_at`);
--> statement-breakpoint
CREATE TABLE `uptime_targets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer,
	`url` text NOT NULL,
	`label` text,
	`enabled` integer NOT NULL DEFAULT 1,
	`expected_status` integer NOT NULL DEFAULT 200,
	`expected_text` text,
	`created_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `uptime_pings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_id` integer NOT NULL,
	`status` integer,
	`latency_ms` integer,
	`ok` integer NOT NULL DEFAULT 0,
	`error` text,
	`checked_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`target_id`) REFERENCES `uptime_targets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `uptime_pings_target_idx` ON `uptime_pings` (`target_id`);
--> statement-breakpoint
CREATE INDEX `uptime_pings_checked_at_idx` ON `uptime_pings` (`checked_at`);
--> statement-breakpoint
CREATE TABLE `redirect_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer,
	`source_path` text NOT NULL,
	`target_url` text NOT NULL,
	`status_code` integer NOT NULL DEFAULT 301,
	`note` text,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	`updated_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `not_found_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer,
	`source_path` text NOT NULL,
	`hits` integer NOT NULL DEFAULT 1,
	`first_seen` integer NOT NULL DEFAULT (unixepoch()),
	`last_seen` integer NOT NULL DEFAULT (unixepoch()),
	`resolved` integer NOT NULL DEFAULT 0,
	`resolved_to_url` text
);
--> statement-breakpoint
CREATE INDEX `not_found_log_client_idx` ON `not_found_log` (`client_id`);
