CREATE TABLE `inquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`inquiry_type` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'new',
	`email_sent` integer DEFAULT 0,
	`email_sent_at` text,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `inquiry_email_idx` ON `inquiries` (`email`);--> statement-breakpoint
CREATE INDEX `inquiry_status_idx` ON `inquiries` (`status`);--> statement-breakpoint
CREATE INDEX `inquiry_type_idx` ON `inquiries` (`inquiry_type`);--> statement-breakpoint
CREATE INDEX `inquiry_created_at_idx` ON `inquiries` (`created_at`);