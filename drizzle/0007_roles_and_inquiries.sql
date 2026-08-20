DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('artist', 'seeker');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'artist' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "commission_open" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE "commission_inquiries" (
  "id" serial PRIMARY KEY NOT NULL,
  "artist_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "sender_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "brief" text NOT NULL,
  "contact" text NOT NULL,
  "budget" text NOT NULL,
  "status" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
