ALTER TABLE "users" ADD COLUMN "trust_level" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "auto_pass" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE "profiles" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "display_name" text NOT NULL,
  "is_verified" boolean DEFAULT false NOT NULL,
  "profile_status" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
