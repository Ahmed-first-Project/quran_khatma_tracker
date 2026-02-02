CREATE TABLE `fridays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fridayNumber` int NOT NULL,
	`dateGregorian` varchar(20) NOT NULL,
	`dateHijri` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fridays_id` PRIMARY KEY(`id`),
	CONSTRAINT `fridays_fridayNumber_unique` UNIQUE(`fridayNumber`)
);
--> statement-breakpoint
CREATE TABLE `persons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fridayNumber` int NOT NULL,
	`juzNumber` int NOT NULL,
	`khatmaNumber` int NOT NULL,
	`groupNumber` int NOT NULL,
	`person1Name` text NOT NULL,
	`person1Status` boolean NOT NULL DEFAULT false,
	`person1Date` datetime,
	`person2Name` text NOT NULL,
	`person2Status` boolean NOT NULL DEFAULT false,
	`person2Date` datetime,
	`person3Name` text NOT NULL,
	`person3Status` boolean NOT NULL DEFAULT false,
	`person3Date` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `readings_id` PRIMARY KEY(`id`)
);
