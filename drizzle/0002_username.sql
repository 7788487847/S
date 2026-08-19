ALTER TABLE "users" ADD COLUMN "username" text;
--> statement-breakpoint
UPDATE "users" SET "username" = 'artist' || "id" WHERE "username" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
