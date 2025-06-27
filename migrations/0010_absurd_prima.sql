DROP INDEX "artists_slug_unique";--> statement-breakpoint
DROP INDEX "slug_idx";--> statement-breakpoint
DROP INDEX "artwork_slug_unique";--> statement-breakpoint
DROP INDEX "artwork_slug_idx";--> statement-breakpoint
DROP INDEX "artwork_artist_idx";--> statement-breakpoint
DROP INDEX "artwork_type_idx";--> statement-breakpoint
DROP INDEX "artwork_artist_unique_idx";--> statement-breakpoint
DROP INDEX "collaborators_artwork_idx";--> statement-breakpoint
DROP INDEX "collaborators_artist_idx";--> statement-breakpoint
DROP INDEX "content_artwork_idx";--> statement-breakpoint
DROP INDEX "content_type_idx";--> statement-breakpoint
DROP INDEX "comment_event_idx";--> statement-breakpoint
DROP INDEX "comment_user_idx";--> statement-breakpoint
DROP INDEX "events_slug_unique";--> statement-breakpoint
DROP INDEX "event_slug_idx";--> statement-breakpoint
DROP INDEX "event_cid_idx";--> statement-breakpoint
DROP INDEX "event_venue_idx";--> statement-breakpoint
DROP INDEX "event_start_date_idx";--> statement-breakpoint
DROP INDEX "event_featured_idx";--> statement-breakpoint
DROP INDEX "gdrive_file_id_idx";--> statement-breakpoint
DROP INDEX "gdrive_user_idx";--> statement-breakpoint
DROP INDEX "gdrive_folder_idx";--> statement-breakpoint
DROP INDEX "media_source_idx";--> statement-breakpoint
DROP INDEX "media_user_idx";--> statement-breakpoint
DROP INDEX "media_status_idx";--> statement-breakpoint
DROP INDEX "media_source_id_idx";--> statement-breakpoint
DROP INDEX "users_cid_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "user_cid_idx";--> statement-breakpoint
DROP INDEX "user_email_idx";--> statement-breakpoint
ALTER TABLE `artwork` ALTER COLUMN "embedding" TO "embedding" blob;--> statement-breakpoint
CREATE UNIQUE INDEX `artists_slug_unique` ON `artists` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `slug_idx` ON `artists` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_slug_unique` ON `artwork` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_slug_idx` ON `artwork` (`slug`);--> statement-breakpoint
CREATE INDEX `artwork_artist_idx` ON `artwork` (`artist_id`);--> statement-breakpoint
CREATE INDEX `artwork_type_idx` ON `artwork` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `artwork_artist_unique_idx` ON `artwork_collaborators` (`artwork_id`,`artist_id`);--> statement-breakpoint
CREATE INDEX `collaborators_artwork_idx` ON `artwork_collaborators` (`artwork_id`);--> statement-breakpoint
CREATE INDEX `collaborators_artist_idx` ON `artwork_collaborators` (`artist_id`);--> statement-breakpoint
CREATE INDEX `content_artwork_idx` ON `content` (`artwork_id`);--> statement-breakpoint
CREATE INDEX `content_type_idx` ON `content` (`type`);--> statement-breakpoint
CREATE INDEX `comment_event_idx` ON `event_comments` (`event_id`);--> statement-breakpoint
CREATE INDEX `comment_user_idx` ON `event_comments` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `event_slug_idx` ON `events` (`slug`);--> statement-breakpoint
CREATE INDEX `event_cid_idx` ON `events` (`cid`);--> statement-breakpoint
CREATE INDEX `event_venue_idx` ON `events` (`venue_id`);--> statement-breakpoint
CREATE INDEX `event_start_date_idx` ON `events` (`start_date`);--> statement-breakpoint
CREATE INDEX `event_featured_idx` ON `events` (`featured`);--> statement-breakpoint
CREATE UNIQUE INDEX `gdrive_file_id_idx` ON `google_drive_assets` (`file_id`);--> statement-breakpoint
CREATE INDEX `gdrive_user_idx` ON `google_drive_assets` (`user_id`);--> statement-breakpoint
CREATE INDEX `gdrive_folder_idx` ON `google_drive_assets` (`folder_id`);--> statement-breakpoint
CREATE INDEX `media_source_idx` ON `media` (`source`);--> statement-breakpoint
CREATE INDEX `media_user_idx` ON `media` (`user_id`);--> statement-breakpoint
CREATE INDEX `media_status_idx` ON `media` (`processing_status`);--> statement-breakpoint
CREATE INDEX `media_source_id_idx` ON `media` (`source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_cid_unique` ON `users` (`cid`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_cid_idx` ON `users` (`cid`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_idx` ON `users` (`email`);