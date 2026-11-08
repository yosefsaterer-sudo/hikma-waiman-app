CREATE TABLE `messenger_push_tokens` (
	`token` varchar(512) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`platform` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messenger_push_tokens_token` PRIMARY KEY(`token`)
);
