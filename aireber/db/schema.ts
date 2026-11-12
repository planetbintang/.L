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

/**
 * BIOS Registry — REIC Table authoritative records.
 * Secrets are represented only by password hashes and random salts.
 */
export const biosDevices = pgTable("bios_devices", {
  id: serial().primaryKey(),
  serialNumber: text("serial_number").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text().notNull().default("member"), // member | admin; assigned by server only
  status: text().notNull().default("active"), // active | disabled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const biosSessions = pgTable("bios_sessions", {
  id: serial().primaryKey(),
  deviceId: integer("device_id").notNull().references(() => biosDevices.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const biosAudit = pgTable("bios_audit", {
  id: serial().primaryKey(),
  deviceId: integer("device_id").references(() => biosDevices.id),
  serialNumber: text("serial_number").notNull(),
  event: text().notNull(),
  detail: jsonb(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
