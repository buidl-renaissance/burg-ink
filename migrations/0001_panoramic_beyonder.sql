DROP INDEX `artists_handle_unique`;--> statement-breakpoint
DROP INDEX `handle_idx`;--> statement-breakpoint
ALTER TABLE `artists` DROP COLUMN `handle`;
