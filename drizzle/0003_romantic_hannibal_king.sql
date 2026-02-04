CREATE TABLE `notificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text NOT NULL,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fridayNumber` int NOT NULL,
	`recipientName` text NOT NULL,
	`recipientChatId` varchar(64) NOT NULL,
	`messageText` text NOT NULL,
	`notificationType` enum('reminder','manual','scheduled') NOT NULL,
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
