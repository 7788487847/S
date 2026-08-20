ALTER TABLE "contact_messages" ADD COLUMN "admin_reply" text;
--> statement-breakpoint
ALTER TABLE "contact_messages" ADD COLUMN "replied_at" timestamp with time zone;
