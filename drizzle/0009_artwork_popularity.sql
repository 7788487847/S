ALTER TABLE "artworks" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "favorite_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE "artwork_favorites" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "artwork_id" integer NOT NULL REFERENCES "artworks"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "artwork_favorites_user_artwork_unique" UNIQUE("user_id","artwork_id")
);
