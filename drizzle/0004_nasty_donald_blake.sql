CREATE TABLE `messenger_message_reads` (
	`messageId` varchar(64) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messenger_message_reads_messageId_accountId_pk` PRIMARY KEY(`messageId`,`accountId`)
);
