ALTER TABLE "users" DROP COLUMN "id_last4_encrypted";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_status" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_banned" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "social_weibo" TO "weibo_url";
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "social_bilibili" TO "bilibili_url";
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "social_xiaohongshu" TO "xiaohongshu_url";
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "social_douyin" TO "douyin_url";
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "social_pixiv" TO "pixiv_url";
--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "social_website" TO "website_url";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lofter_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tuya_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banciyuan_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "twitter_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "instagram_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "artstation_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deviantart_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "behance_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_show" text;
--> statement-breakpoint
ALTER TABLE "artworks" ADD COLUMN "images" text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
CREATE TABLE "verification_applications" ("id" serial PRIMARY KEY NOT NULL,"user_id" integer NOT NULL,"real_name" text,"representative_images" text NOT NULL,"status" integer DEFAULT 0 NOT NULL,"created_at" timestamp with time zone DEFAULT now() NOT NULL,"reviewed_at" timestamp with time zone);
--> statement-breakpoint
ALTER TABLE "verification_applications" ADD CONSTRAINT "verification_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "reports" ("id" serial PRIMARY KEY NOT NULL,"target_type" text NOT NULL,"target_id" integer NOT NULL,"reason" text NOT NULL,"description" text,"reporter_email" text NOT NULL,"status" integer DEFAULT 0 NOT NULL,"created_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "complaints" ("id" serial PRIMARY KEY NOT NULL,"name" text NOT NULL,"email" text NOT NULL,"target_url" text NOT NULL,"description" text NOT NULL,"status" integer DEFAULT 0 NOT NULL,"created_at" timestamp with time zone DEFAULT now() NOT NULL);
