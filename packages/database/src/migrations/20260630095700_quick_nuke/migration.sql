CREATE TABLE `labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL UNIQUE,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ticket_labels` (
	`ticket_id` integer NOT NULL,
	`label_id` integer NOT NULL,
	CONSTRAINT `ticket_labels_pk` PRIMARY KEY(`ticket_id`, `label_id`),
	CONSTRAINT `fk_ticket_labels_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`),
	CONSTRAINT `fk_ticket_labels_label_id_labels_id_fk` FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`)
);
