ALTER TABLE `audit_issues` ADD COLUMN `fix_steps` text;
--> statement-breakpoint
ALTER TABLE `audit_issues` ADD COLUMN `category` text;
--> statement-breakpoint
ALTER TABLE `audit_issues` ADD COLUMN `ai_generated` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `audit_issues` ADD COLUMN `notes` text;
--> statement-breakpoint
ALTER TABLE `audits` ADD COLUMN `kind` text DEFAULT 'crawler' NOT NULL;
--> statement-breakpoint
ALTER TABLE `audits` ADD COLUMN `target_url` text;
--> statement-breakpoint
ALTER TABLE `audits` ADD COLUMN `summary` text;
