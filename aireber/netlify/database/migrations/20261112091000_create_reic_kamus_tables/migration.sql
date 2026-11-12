CREATE TABLE IF NOT EXISTS "reic_kamus_users" (
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
CREATE TABLE IF NOT EXISTS "reic_kamus_sessions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "reic_kamus_users"("id"),
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reic_kamus_sessions_user_idx" ON "reic_kamus_sessions" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reic_kamus_records" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "reic_kamus_users"("id"),
  "kind" text NOT NULL,
  "record_key" text NOT NULL,
  "name" text NOT NULL,
  "content" text,
  "mime" text,
  "size" integer NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reic_kamus_records_owner_kind_idx" ON "reic_kamus_records" ("user_id", "kind");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reic_kamus_settings" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL UNIQUE REFERENCES "reic_kamus_users"("id"),
  "settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reic_kamus_audit" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "reic_kamus_users"("id"),
  "action" text NOT NULL,
  "detail" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reic_kamus_audit_owner_created_idx" ON "reic_kamus_audit" ("user_id", "created_at");
