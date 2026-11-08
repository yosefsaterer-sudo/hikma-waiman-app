CREATE TABLE `messenger_accounts` (
	`id` varchar(36) NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`recoveryHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messenger_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `messenger_accounts_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `messenger_media` (
	`id` varchar(64) NOT NULL,
	`uploaderId` varchar(36) NOT NULL,
	`storageUrl` text NOT NULL,
	`mimeType` varchar(160) NOT NULL,
	`name` varchar(255) NOT NULL,
	`size` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messenger_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messenger_messages` (
	`id` varchar(64) NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`senderId` varchar(36) NOT NULL,
	`text` text NOT NULL,
	`mediaJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messenger_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messenger_sessions` (
	`tokenHash` varchar(128) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messenger_sessions_tokenHash` PRIMARY KEY(`tokenHash`)
);
