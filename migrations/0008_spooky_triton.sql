CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`source` text NOT NULL,
	`source_id` text,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer,
	`width` integer,
	`height` integer,
	`spaces_key` text,
	`spaces_url` text,
	`thumbnail_url` text,
	`processing_status` text DEFAULT 'pending',
	`ai_analysis` text,
	`metadata` text,
	`tags` text,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`processed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `media_source_idx` ON `media` (`source`);--> statement-breakpoint
CREATE INDEX `media_user_idx` ON `media` (`user_id`);--> statement-breakpoint
CREATE INDEX `media_status_idx` ON `media` (`processing_status`);--> statement-breakpoint
CREATE INDEX `media_source_id_idx` ON `media` (`source_id`);