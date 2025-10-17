ALTER TABLE `users` ADD `role` text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `is_verified` integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX `user_role_idx` ON `users` (`role`);