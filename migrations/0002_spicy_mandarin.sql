CREATE TABLE `event_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`user_id` integer,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` text,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `comment_event_idx` ON `event_comments` (`event_id`);--> statement-breakpoint
CREATE INDEX `comment_user_idx` ON `event_comments` (`user_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cid` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text,
	`excerpt` text,
	`image` text,
	`image_data` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`categories` text,
	`event_categories` text,
	`featured` integer DEFAULT 0,
	`host` text,
	`venue_id` integer,
	`url` text,
	`data` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` text,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_slug_idx` ON `events` (`slug`);--> statement-breakpoint
CREATE INDEX `event_cid_idx` ON `events` (`cid`);--> statement-breakpoint
CREATE INDEX `event_venue_idx` ON `events` (`venue_id`);--> statement-breakpoint
CREATE INDEX `event_start_date_idx` ON `events` (`start_date`);--> statement-breakpoint
CREATE INDEX `event_featured_idx` ON `events` (`featured`);--> statement-breakpoint
CREATE TABLE `venues` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`city` text,
	`state` text,
	`phone` text,
	`email` text,
	`website` text,
	`zip_code` text,
	`country` text,
	`place_id` text,
	`geo` text,
	`data` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` text
);
