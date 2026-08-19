ALTER TABLE "artworks" ADD COLUMN "thumbnail_url" text;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "display_url" text;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "original_url" text;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "image_variants" text DEFAULT '[]' NOT NULL;
