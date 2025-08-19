CREATE TABLE `emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resend_id` text,
	`subject` text NOT NULL,
	`from` text NOT NULL,
	`to` text NOT NULL,
	`cc` text,
	`bcc` text,
	`html_content` text,
	`text_content` text,
	`status` text DEFAULT 'pending',
	`error_message` text,
	`sent_at` text,
	`delivered_at` text,
	`opened_at` text,
	`clicked_at` text,
	`bounced_at` text,
	`complained_at` text,
	`unsubscribed_at` text,
	`metadata` text,
	`template_id` text,
	`inquiry_id` integer,
	`user_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `emails_resend_id_unique` ON `emails` (`resend_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_resend_id_idx` ON `emails` (`resend_id`);--> statement-breakpoint
CREATE INDEX `email_status_idx` ON `emails` (`status`);--> statement-breakpoint
CREATE INDEX `email_from_idx` ON `emails` (`from`);--> statement-breakpoint
CREATE INDEX `email_to_idx` ON `emails` (`to`);--> statement-breakpoint
CREATE INDEX `email_sent_at_idx` ON `emails` (`sent_at`);--> statement-breakpoint
CREATE INDEX `email_created_at_idx` ON `emails` (`created_at`);--> statement-breakpoint
CREATE INDEX `email_inquiry_idx` ON `emails` (`inquiry_id`);--> statement-breakpoint
CREATE INDEX `email_user_idx` ON `emails` (`user_id`);