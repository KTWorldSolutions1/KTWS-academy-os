ALTER TABLE `audit` ADD `revision` integer;--> statement-breakpoint
ALTER TABLE `audit` ADD `actor` text;--> statement-breakpoint
ALTER TABLE `audit` ADD `snapshot` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_audit_record_revision` ON `audit` (`owner`,`record_id`,`revision`);