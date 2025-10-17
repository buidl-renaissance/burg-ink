CREATE TABLE `marketing_conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`artist_id` integer,
	`title` text NOT NULL,
	`messages` text NOT NULL,
	`artist_profile` text,
	`conversation_stage` text DEFAULT 'intro',
	`is_active` integer DEFAULT 1,
	`tags` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_message_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `conversation_user_idx` ON `marketing_conversations` (`user_id`);--> statement-breakpoint
CREATE INDEX `conversation_artist_idx` ON `marketing_conversations` (`artist_id`);--> statement-breakpoint
CREATE INDEX `conversation_active_idx` ON `marketing_conversations` (`is_active`);--> statement-breakpoint
CREATE INDEX `conversation_last_message_idx` ON `marketing_conversations` (`last_message_at`);