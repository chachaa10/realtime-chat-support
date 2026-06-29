CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`message_id` integer,
	`ticket_id` integer NOT NULL,
	`uploader_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`file_path` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_attachments_message_id_messages_id_fk` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`),
	CONSTRAINT `fk_attachments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`),
	CONSTRAINT `fk_attachments_uploader_id_profiles_id_fk` FOREIGN KEY (`uploader_id`) REFERENCES `profiles`(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`ticket_id` integer NOT NULL,
	`author_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_messages_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`),
	CONSTRAINT `fk_messages_author_id_profiles_id_fk` FOREIGN KEY (`author_id`) REFERENCES `profiles`(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`ticket_id` integer NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`actor_id` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_ticket_events_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`),
	CONSTRAINT `fk_ticket_events_actor_id_profiles_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `profiles`(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`subject` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`customer_id` text NOT NULL,
	`agent_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`resolved_at` integer,
	`cancelled_at` integer,
	CONSTRAINT `fk_tickets_customer_id_profiles_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `profiles`(`id`),
	CONSTRAINT `fk_tickets_agent_id_profiles_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `profiles`(`id`)
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_profiles` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_profiles_id_users_id_fk` FOREIGN KEY (`id`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
INSERT INTO `__new_profiles`(`id`, `name`, `role`, `created_at`) SELECT `id`, `name`, `role`, `created_at` FROM `profiles`;--> statement-breakpoint
DROP TABLE `profiles`;--> statement-breakpoint
ALTER TABLE `__new_profiles` RENAME TO `profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_attachments_ticket` ON `attachments` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_attachments_msg_created` ON `attachments` (`message_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_attachments_uploader` ON `attachments` (`uploader_id`);--> statement-breakpoint
CREATE INDEX `idx_messages_ticket_created` ON `messages` (`ticket_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_events_ticket_created` ON `ticket_events` (`ticket_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tickets_status_created` ON `tickets` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tickets_customer` ON `tickets` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_tickets_agent` ON `tickets` (`agent_id`);