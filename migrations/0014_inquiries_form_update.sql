ALTER TABLE `inquiries` ADD COLUMN `first_name` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `last_name` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `budget` text;--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `tattoo_concept` text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `animal_person_emotion` text;--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `abstract_energy` text;--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `tattoo_size` text;--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `color_preference` text;--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `photo_references` text;--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `placement_photos` text;--> statement-breakpoint
ALTER TABLE `inquiries` ADD COLUMN `newsletter_signup` integer DEFAULT 0;
