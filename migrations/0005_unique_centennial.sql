CREATE TABLE `google_drive_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`file_id` text NOT NULL,
	`folder_id` text,
	`name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` text,
	`web_content_link` text,
	`thumbnail_link` text,
	`created_time` text,
	`modified_time` text,
	`sync_status` text DEFAULT 'pending',
	`artwork_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artwork_id`) REFERENCES `artwork`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gdrive_file_id_idx` ON `google_drive_assets` (`file_id`);--> statement-breakpoint
CREATE INDEX `gdrive_user_idx` ON `google_drive_assets` (`user_id`);--> statement-breakpoint
CREATE INDEX `gdrive_folder_idx` ON `google_drive_assets` (`folder_id`);