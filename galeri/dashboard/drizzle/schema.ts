import {
  bigint,
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const fileFolders = mysqlTable(
  "file_folders",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    parentId: int("parentId"),
    name: varchar("name", { length: 255 }).notNull(),
    kind: mysqlEnum("kind", [
      "all-files",
      "photos",
      "videos",
      "movies",
      "shared",
      "favorites",
      "documents",
      "custom",
    ]).default("custom").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ownerParentIdx: index("file_folders_owner_parent_idx").on(table.ownerId, table.parentId),
    ownerNameIdx: index("file_folders_owner_name_idx").on(table.ownerId, table.name),
    ownerNameUnique: uniqueIndex("file_folders_owner_parent_name_unique").on(
      table.ownerId,
      table.parentId,
      table.name,
    ),
  }),
);

export const storedFiles = mysqlTable(
  "stored_files",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    folderId: int("folderId"),
    originalName: varchar("originalName", { length: 255 }).notNull(),
    storageKey: varchar("storageKey", { length: 700 }).notNull(),
    stableUrl: varchar("stableUrl", { length: 768 }).notNull(),
    mimeType: varchar("mimeType", { length: 255 }).notNull().default("application/octet-stream"),
    category: mysqlEnum("category", ["document", "photo", "video", "movie", "other"]).default("other").notNull(),
    sizeBytes: bigint("sizeBytes", { mode: "number", unsigned: true }).notNull().default(0),
    isFavorite: boolean("isFavorite").notNull().default(false),
    status: mysqlEnum("status", ["active", "deleted"]).notNull().default("active"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ownerFolderIdx: index("stored_files_owner_folder_idx").on(table.ownerId, table.folderId, table.status),
    ownerNameIdx: index("stored_files_owner_name_idx").on(table.ownerId, table.originalName),
    ownerCategoryIdx: index("stored_files_owner_category_idx").on(table.ownerId, table.category, table.status),
  }),
);

export const fileShares = mysqlTable(
  "file_shares",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    fileId: int("fileId"),
    folderId: int("folderId"),
    sharedWithEmail: varchar("sharedWithEmail", { length: 320 }).notNull(),
    permission: mysqlEnum("permission", ["viewer", "editor"]).notNull().default("viewer"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    ownerIdx: index("file_shares_owner_idx").on(table.ownerId, table.createdAt),
    recipientIdx: index("file_shares_recipient_idx").on(table.sharedWithEmail, table.createdAt),
  }),
);

export const fileActivities = mysqlTable(
  "file_activities",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    actorName: varchar("actorName", { length: 255 }).notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    targetName: varchar("targetName", { length: 255 }).notNull(),
    fileId: int("fileId"),
    folderId: int("folderId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    ownerCreatedIdx: index("file_activities_owner_created_idx").on(table.ownerId, table.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type FileFolder = typeof fileFolders.$inferSelect;
export type StoredFile = typeof storedFiles.$inferSelect;
export type FileShare = typeof fileShares.$inferSelect;
export type FileActivity = typeof fileActivities.$inferSelect;
