import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const fsNodes = pgTable("fs_nodes", {
  id: serial().primaryKey(),
  parentId: integer("parent_id"),
  name: text().notNull(),
  type: text().notNull(), // 'file' | 'folder'
  extension: text(), // .ieje | .aeea | .nz | .ck | .regs | .log
  content: text(),
  path: text().notNull().unique(),
  metadata: jsonb(),
  isVirtual: boolean("is_virtual").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  domain: text(),
  description: text(),
  systemPath: text("system_path"),
  config: jsonb(),
  status: text().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial().primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  title: text(),
  messages: jsonb().notNull().default("[]"),
  context: text(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const kataCustom = pgTable("kata_custom", {
  id: serial().primaryKey(),
  kata: text().notNull().unique(),
  category: text().notNull(),
  lang: text().default("id"),
  indexContent: text("index_content"),
  styleContent: text("style_content"),
  fungsiContent: text("fungsi_content"),
  metadata: jsonb(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
