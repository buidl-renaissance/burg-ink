CREATE TABLE `artists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`handle` text NOT NULL,
	`slug` text NOT NULL,
	`profile_picture` text,
	`bio` text,
	`social_links_id` integer,
	`tags` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`deleted_at` text,
	FOREIGN KEY (`social_links_id`) REFERENCES `social_links`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artists_handle_unique` ON `artists` (`handle`);--> statement-breakpoint
CREATE UNIQUE INDEX `artists_slug_unique` ON `artists` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `handle_idx` ON `artists` (`handle`);--> statement-breakpoint
CREATE UNIQUE INDEX `slug_idx` ON `artists` (`slug`);--> statement-breakpoint
CREATE TABLE `artwork` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`artist_id` integer,
	`image` text,
	`collaborator_ids` text,
	`category` text,
	`is_for_sale` integer DEFAULT false,
	`price` real,
	`num_collaborators` integer DEFAULT 0,
	`review_text` text,
	`review_image` text,
	`artist_name` text,
	`uploaded_by` text,
	`transaction_digest` text,
	`meta` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_slug_unique` ON `artwork` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_slug_idx` ON `artwork` (`slug`);--> statement-breakpoint
CREATE INDEX `artwork_artist_idx` ON `artwork` (`artist_id`);--> statement-breakpoint
CREATE INDEX `artwork_type_idx` ON `artwork` (`type`);--> statement-breakpoint
CREATE TABLE `artwork_collaborators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`artwork_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`artwork_id`) REFERENCES `artwork`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_artist_unique_idx` ON `artwork_collaborators` (`artwork_id`,`artist_id`);--> statement-breakpoint
CREATE INDEX `collaborators_artwork_idx` ON `artwork_collaborators` (`artwork_id`);--> statement-breakpoint
CREATE INDEX `collaborators_artist_idx` ON `artwork_collaborators` (`artist_id`);--> statement-breakpoint
CREATE TABLE `content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`artwork_id` integer NOT NULL,
	`user_id` integer,
	`width` integer,
	`height` integer,
	`type` text NOT NULL,
	`youtube_id` text,
	`url` text,
	`caption` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`artwork_id`) REFERENCES `artwork`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `content_artwork_idx` ON `content` (`artwork_id`);--> statement-breakpoint
CREATE INDEX `content_type_idx` ON `content` (`type`);--> statement-breakpoint
CREATE TABLE `social_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`twitter` text,
	`instagram` text,
	`linkedin` text,
	`github` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cid` text,
	`name` text NOT NULL,
	`email` text,
	`bio` text,
	`profile_picture` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_cid_unique` ON `users` (`cid`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_cid_idx` ON `users` (`cid`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_idx` ON `users` (`email`);