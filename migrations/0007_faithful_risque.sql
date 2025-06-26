ALTER TABLE `google_drive_assets` ADD `spaces_key` text;--> statement-breakpoint
ALTER TABLE `google_drive_assets` ADD `spaces_url` text;--> statement-breakpoint
ALTER TABLE `google_drive_assets` DROP COLUMN `local_file_path`;--> statement-breakpoint
ALTER TABLE `google_drive_assets` DROP COLUMN `local_file_url`;