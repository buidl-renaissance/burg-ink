CREATE TABLE `tattoos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`artist_id` integer,
	`image` text,
	`category` text,
	`placement` text,
	`size` text,
	`style` text,
	`meta` text,
	`data` text,
	`embedding` blob,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` text,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tattoos_slug_unique` ON `tattoos` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `tattoos_slug_idx` ON `tattoos` (`slug`);--> statement-breakpoint
CREATE INDEX `tattoos_artist_idx` ON `tattoos` (`artist_id`);--> statement-breakpoint
CREATE INDEX `tattoos_category_idx` ON `tattoos` (`category`);