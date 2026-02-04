ALTER TABLE `persons` ADD `telegramChatId` varchar(64);--> statement-breakpoint
ALTER TABLE `persons` ADD `telegramUsername` varchar(64);--> statement-breakpoint
ALTER TABLE `persons` ADD `isAdmin` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `persons` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;