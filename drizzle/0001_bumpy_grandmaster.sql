CREATE TABLE `discovery_answers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`opportunity_id` varchar(64) NOT NULL,
	`theme_code` varchar(10) NOT NULL,
	`question_id` varchar(64) NOT NULL,
	`question_text` text NOT NULL,
	`answer_text` text,
	`state` enum('answered','skipped_by_rule','system_confirmed','pending') NOT NULL DEFAULT 'pending',
	`confidence` int DEFAULT 0,
	`provenance` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discovery_answers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discovery_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunity_id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`status` enum('open','in_progress','submitted','completed') NOT NULL DEFAULT 'open',
	`programme_kind` enum('new','repeat','new_content_same_cohort') NOT NULL,
	`total_questions` int NOT NULL DEFAULT 0,
	`answered_count` int NOT NULL DEFAULT 0,
	`skipped_by_rule_count` int NOT NULL DEFAULT 0,
	`system_confirmed_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submitted_at` timestamp,
	CONSTRAINT `discovery_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `downstream_payloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` int NOT NULL,
	`opportunity_id` varchar(64) NOT NULL,
	`stage_type` enum('competency_mapping','architecture_stage','approach_note') NOT NULL,
	`payload` text NOT NULL,
	`is_valid` int NOT NULL DEFAULT 1,
	`validation_errors` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `downstream_payloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `question_state_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`answer_id` int NOT NULL,
	`previous_state` varchar(50),
	`current_state` enum('answered','skipped_by_rule','system_confirmed','pending') NOT NULL,
	`reason` text,
	`transitioned_at` timestamp NOT NULL DEFAULT (now()),
	`transitioned_by` int,
	CONSTRAINT `question_state_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `discovery_answers` ADD CONSTRAINT `discovery_answers_session_id_discovery_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `discovery_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discovery_sessions` ADD CONSTRAINT `discovery_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `downstream_payloads` ADD CONSTRAINT `downstream_payloads_session_id_discovery_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `discovery_sessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_state_tracking` ADD CONSTRAINT `question_state_tracking_answer_id_discovery_answers_id_fk` FOREIGN KEY (`answer_id`) REFERENCES `discovery_answers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `question_state_tracking` ADD CONSTRAINT `question_state_tracking_transitioned_by_users_id_fk` FOREIGN KEY (`transitioned_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;