ALTER TABLE "users" ADD COLUMN "social_xiaohongshu" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "social_douyin" text;
--> statement-breakpoint
CREATE TABLE "artist_applications" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "status" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "artist_applications" ADD CONSTRAINT "artist_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
