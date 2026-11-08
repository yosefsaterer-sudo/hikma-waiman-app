CREATE TABLE `messenger_conversation_members` (
	`id` varchar(80) NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messenger_conversation_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messenger_conversations` (
	`id` varchar(64) NOT NULL,
	`kind` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messenger_conversations_id` PRIMARY KEY(`id`)
);
