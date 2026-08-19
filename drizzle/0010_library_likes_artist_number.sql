ALTER TABLE "users" ADD COLUMN "artist_number" integer UNIQUE;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "like_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE "artwork_likes" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "artwork_id" integer NOT NULL REFERENCES "artworks"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "artwork_likes_user_artwork_unique" UNIQUE("user_id","artwork_id")
);
--> statement-breakpoint
CREATE TABLE "artwork_views" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "artwork_id" integer NOT NULL REFERENCES "artworks"("id") ON DELETE CASCADE,
  "viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "artwork_views_user_artwork_unique" UNIQUE("user_id","artwork_id")
);
