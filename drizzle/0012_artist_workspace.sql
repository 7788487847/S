ALTER TABLE "artworks" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE "notifications" (
 "id" serial PRIMARY KEY NOT NULL,
 "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
 "type" text NOT NULL,
 "title" text NOT NULL,
 "body" text,
 "target_url" text,
 "is_read" boolean DEFAULT false NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_views" (
 "id" serial PRIMARY KEY NOT NULL,
 "artist_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
 "viewer_key" text NOT NULL,
 "viewed_on" text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "profile_views_artist_key_day_unique" UNIQUE("artist_id","viewer_key","viewed_on")
);
--> statement-breakpoint
CREATE TABLE "artwork_daily_views" (
 "id" serial PRIMARY KEY NOT NULL,
 "artwork_id" integer NOT NULL REFERENCES "artworks"("id") ON DELETE CASCADE,
 "viewer_key" text NOT NULL,
 "viewed_on" text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "artwork_daily_views_artwork_key_day_unique" UNIQUE("artwork_id","viewer_key","viewed_on")
);
