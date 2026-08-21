CREATE TABLE IF NOT EXISTS "announcements" (
 "id" serial PRIMARY KEY NOT NULL,
 "title" text NOT NULL,
 "content" text NOT NULL,
 "status" integer DEFAULT 0 NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
