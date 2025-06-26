ALTER TABLE `users` ADD `google_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `google_drive_folder_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `google_drive_sync_enabled` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `last_sync_at` text;