CREATE TABLE `file_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`actorName` varchar(255) NOT NULL,
	`action` varchar(64) NOT NULL,
	`targetName` varchar(255) NOT NULL,
	`fileId` int,
	`folderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`parentId` int,
	`name` varchar(255) NOT NULL,
	`kind` enum('all-files','photos','videos','movies','shared','favorites','documents','custom') NOT NULL DEFAULT 'custom',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `file_folders_id` PRIMARY KEY(`id`),
	CONSTRAINT `file_folders_owner_parent_name_unique` UNIQUE(`ownerId`,`parentId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `file_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`fileId` int,
	`folderId` int,
	`sharedWithEmail` varchar(320) NOT NULL,
	`permission` enum('viewer','editor') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stored_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`folderId` int,
	`originalName` varchar(255) NOT NULL,
	`storageKey` varchar(700) NOT NULL,
	`stableUrl` varchar(768) NOT NULL,
	`mimeType` varchar(255) NOT NULL DEFAULT 'application/octet-stream',
	`category` enum('document','photo','video','movie','other') NOT NULL DEFAULT 'other',
	`sizeBytes` bigint unsigned NOT NULL DEFAULT 0,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`status` enum('active','deleted') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stored_files_id` PRIMARY KEY(`id`),
	CONSTRAINT `stored_files_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
ALTER TABLE `file_activities` ADD CONSTRAINT `file_activities_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `file_folders` ADD CONSTRAINT `file_folders_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `file_shares` ADD CONSTRAINT `file_shares_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stored_files` ADD CONSTRAINT `stored_files_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `file_activities_owner_created_idx` ON `file_activities` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `file_folders_owner_parent_idx` ON `file_folders` (`ownerId`,`parentId`);--> statement-breakpoint
CREATE INDEX `file_folders_owner_name_idx` ON `file_folders` (`ownerId`,`name`);--> statement-breakpoint
CREATE INDEX `file_shares_owner_idx` ON `file_shares` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `file_shares_recipient_idx` ON `file_shares` (`sharedWithEmail`,`createdAt`);--> statement-breakpoint
CREATE INDEX `stored_files_owner_folder_idx` ON `stored_files` (`ownerId`,`folderId`,`status`);--> statement-breakpoint
CREATE INDEX `stored_files_owner_name_idx` ON `stored_files` (`ownerId`,`originalName`);--> statement-breakpoint
CREATE INDEX `stored_files_owner_category_idx` ON `stored_files` (`ownerId`,`category`,`status`);