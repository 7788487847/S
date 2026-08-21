ALTER TABLE "users" ADD COLUMN "age_14_confirmed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "adult_confirmed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE "contact_messages" (
 "id" serial PRIMARY KEY NOT NULL,
 "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
 "message" text NOT NULL,
 "status" integer DEFAULT 0 NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "resolved_at" timestamp with time zone
);
