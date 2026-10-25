CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY,
	"session_id" text NOT NULL UNIQUE,
	"title" text,
	"messages" jsonb DEFAULT '"[]"' NOT NULL,
	"context" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fs_nodes" (
	"id" serial PRIMARY KEY,
	"parent_id" integer,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"extension" text,
	"content" text,
	"path" text NOT NULL UNIQUE,
	"metadata" jsonb,
	"is_virtual" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kata_custom" (
	"id" serial PRIMARY KEY,
	"kata" text NOT NULL UNIQUE,
	"category" text NOT NULL,
	"lang" text DEFAULT 'id',
	"index_content" text,
	"style_content" text,
	"fungsi_content" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"domain" text,
	"description" text,
	"system_path" text,
	"config" jsonb,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
