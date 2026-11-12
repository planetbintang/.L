ALTER TABLE "aireber_users"
  ADD COLUMN IF NOT EXISTS "plan" text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "quota_requests" integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "used_requests" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "quota_reset_at" timestamp NOT NULL DEFAULT now();
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aireber_usage" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "aireber_users"("id"),
  "action" text NOT NULL DEFAULT 'chat',
  "units" integer NOT NULL DEFAULT 1,
  "model" text,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aireber_usage_user_created_idx" ON "aireber_usage" ("user_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aireber_plans" (
  "id" serial PRIMARY KEY,
  "plan_key" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "monthly_price_idr" integer NOT NULL DEFAULT 0,
  "monthly_requests" integer NOT NULL DEFAULT 30,
  "features" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
INSERT INTO "aireber_plans" ("plan_key","name","monthly_price_idr","monthly_requests","features") VALUES
('free','Free',0,30,'["30 permintaan AI per bulan","Akses AI Studio"]'::jsonb),
('creator','Creator',99000,500,'["500 permintaan AI per bulan","Produksi website, aplikasi, dan chat"]'::jsonb),
('pro','Pro',299000,3000,'["3.000 permintaan AI per bulan","Produksi intensif dan workflow"]'::jsonb),
('enterprise','Enterprise',0,30000,'["30.000 permintaan AI per bulan","Kapasitas tim dan dukungan enterprise"]'::jsonb)
ON CONFLICT ("plan_key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "monthly_price_idr" = EXCLUDED."monthly_price_idr",
  "monthly_requests" = EXCLUDED."monthly_requests",
  "features" = EXCLUDED."features";
