CREATE TABLE `school_files` (
	`key` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`campus` text NOT NULL,
	`student` text,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`actor` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_files_owner_student` ON `school_files` (`owner`,`student`);