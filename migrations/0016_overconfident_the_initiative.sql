CREATE TABLE `taxonomy` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`namespace` text NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`order` integer DEFAULT 0,
	`is_active` integer DEFAULT 1,
	`parent_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `taxonomy_namespace_key_idx` ON `taxonomy` (`namespace`,`key`);--> statement-breakpoint
CREATE INDEX `taxonomy_namespace_idx` ON `taxonomy` (`namespace`);--> statement-breakpoint
CREATE INDEX `taxonomy_parent_idx` ON `taxonomy` (`parent_id`);--> statement-breakpoint
CREATE INDEX `taxonomy_active_idx` ON `taxonomy` (`is_active`);--> statement-breakpoint
CREATE TABLE `workflow_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`trigger` text NOT NULL,
	`conditions` text NOT NULL,
	`actions` text NOT NULL,
	`is_enabled` integer DEFAULT 1,
	`priority` integer DEFAULT 0,
	`last_fired_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `workflow_enabled_idx` ON `workflow_rules` (`is_enabled`);--> statement-breakpoint
CREATE INDEX `workflow_trigger_idx` ON `workflow_rules` (`trigger`);--> statement-breakpoint
CREATE INDEX `workflow_priority_idx` ON `workflow_rules` (`priority`);--> statement-breakpoint
ALTER TABLE `media` ADD `detected_type` text;--> statement-breakpoint
ALTER TABLE `media` ADD `detection_confidence` text;--> statement-breakpoint
ALTER TABLE `media` ADD `detections` text;--> statement-breakpoint
ALTER TABLE `media` ADD `suggested_entity_id` integer;--> statement-breakpoint
ALTER TABLE `media` ADD `suggested_entity_type` text;--> statement-breakpoint
CREATE INDEX `media_detected_type_idx` ON `media` (`detected_type`);--> statement-breakpoint
CREATE INDEX `media_confidence_idx` ON `media` (`detection_confidence`);