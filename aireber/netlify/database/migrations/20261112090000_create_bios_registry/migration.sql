CREATE TABLE IF NOT EXISTS "bios_devices" (
  "id" serial PRIMARY KEY,
  "serial_number" text NOT NULL UNIQUE,
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
CREATE TABLE IF NOT EXISTS "bios_sessions" (
  "id" serial PRIMARY KEY,
  "device_id" integer NOT NULL REFERENCES "bios_devices"("id"),
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bios_sessions_device_idx" ON "bios_sessions" ("device_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bios_audit" (
  "id" serial PRIMARY KEY,
  "device_id" integer REFERENCES "bios_devices"("id"),
  "serial_number" text NOT NULL,
  "event" text NOT NULL,
  "detail" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bios_audit_device_created_idx" ON "bios_audit" ("device_id", "created_at");
