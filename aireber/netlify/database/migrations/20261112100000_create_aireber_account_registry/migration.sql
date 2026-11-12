CREATE TABLE IF NOT EXISTS "aireber_users" (
  "id" serial PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "password_hash" text NOT NULL,
  "password_salt" text NOT NULL,
  "role" text NOT NULL DEFAULT 'member',
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "last_login_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aireber_sessions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "aireber_users"("id"),
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aireber_sessions_user_idx" ON "aireber_sessions" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aireber_files" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "aireber_users"("id"),
  "path" text NOT NULL,
  "name" text NOT NULL,
  "mime" text NOT NULL DEFAULT 'text/plain',
  "content" text NOT NULL DEFAULT '',
  "size" integer NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "aireber_files_user_path_idx" ON "aireber_files" ("user_id", "path");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aireber_settings" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL UNIQUE REFERENCES "aireber_users"("id"),
  "settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aireber_audit" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "aireber_users"("id"),
  "action" text NOT NULL,
  "detail" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aireber_audit_owner_created_idx" ON "aireber_audit" ("user_id", "created_at");
