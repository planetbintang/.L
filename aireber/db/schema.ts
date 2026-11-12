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
  type: text().notNull(),
  extension: text(),
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

/** BIOS Registry — REIC Table authoritative records. */
export const biosDevices = pgTable("bios_devices", {
  id: serial().primaryKey(),
  serialNumber: text("serial_number").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text().notNull().default("member"),
  status: text().notNull().default("active"),
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

/** Kamus Digital accounts — password hashes only; raw passwords never persist. */
export const reicKamusUsers = pgTable("reic_kamus_users", {
  id: serial().primaryKey(),
  email: text().notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  role: text().notNull().default("member"),
  status: text().notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const reicKamusSessions = pgTable("reic_kamus_sessions", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull().references(() => reicKamusUsers.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reicKamusRecords = pgTable("reic_kamus_records", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull().references(() => reicKamusUsers.id),
  kind: text().notNull(), // collection | file | history
  recordKey: text("record_key").notNull(),
  name: text().notNull(),
  content: text(),
  mime: text(),
  size: integer().notNull().default(0),
  metadata: jsonb(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reicKamusSettings = pgTable("reic_kamus_settings", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => reicKamusUsers.id),
  settings: jsonb().notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reicKamusAudit = pgTable("reic_kamus_audit", {
  id: serial().primaryKey(),
  userId: integer("user_id").references(() => reicKamusUsers.id),
  action: text().notNull(),
  detail: jsonb(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
