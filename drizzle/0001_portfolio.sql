DROP TABLE "app_meta";
--> statement-breakpoint
CREATE TABLE "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "display_name" text NOT NULL,
  "avatar_url" text,
  "bio" text,
  "social_bilibili" text,
  "social_weibo" text,
  "social_pixiv" text,
  "social_website" text,
  "real_name" text,
  "id_last4_encrypted" text,
  "is_verified" boolean DEFAULT false NOT NULL,
  "is_vip" boolean DEFAULT false NOT NULL,
  "email_activated" boolean DEFAULT false NOT NULL,
  "activation_token" text,
  "activation_expires_at" timestamp with time zone,
  "verification_requested_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "artworks" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "title" text NOT NULL,
  "image_url" text NOT NULL,
  "tags" text DEFAULT '' NOT NULL,
  "description" text,
  "status" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
