ALTER TABLE "users" ADD COLUMN "email_hash" text UNIQUE;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consent_agreed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consent_version" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "data_deletion_requested_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "copyright_strike_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "image_hashes" text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "artwork_type" text DEFAULT 'original' NOT NULL;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "copyright_risk" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "complaints" RENAME COLUMN "target_url" TO "target_urls";
--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "ownership_proof" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "proof_images" text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
CREATE TABLE "audit_logs" ("id" serial PRIMARY KEY NOT NULL,"actor" text NOT NULL,"target_type" text NOT NULL,"target_id" integer NOT NULL,"action" text NOT NULL,"detail" text,"created_at" timestamp with time zone DEFAULT now() NOT NULL);
