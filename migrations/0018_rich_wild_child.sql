CREATE TABLE `saved_marketing_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`artist_id` integer,
	`entity_id` integer,
	`entity_type` text,
	`content_type` text NOT NULL,
	`platform` text NOT NULL,
	`tone` text NOT NULL,
	`content` text NOT NULL,
	`hashtags` text,
	`metadata` text,
	`title` text,
	`tags` text,
	`is_favorite` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `saved_content_user_idx` ON `saved_marketing_content` (`user_id`);--> statement-breakpoint
CREATE INDEX `saved_content_artist_idx` ON `saved_marketing_content` (`artist_id`);--> statement-breakpoint
CREATE INDEX `saved_content_type_idx` ON `saved_marketing_content` (`content_type`);--> statement-breakpoint
CREATE INDEX `saved_content_platform_idx` ON `saved_marketing_content` (`platform`);--> statement-breakpoint
ALTER TABLE `media` DROP COLUMN `updated_at`;