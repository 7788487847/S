CREATE TABLE IF NOT EXISTS "site_settings" (
 "id" serial PRIMARY KEY NOT NULL,
 "site_name" text DEFAULT '灵犀' NOT NULL,
 "site_url" text DEFAULT 'https://www.rinsea.cn' NOT NULL,
 "contact_email" text DEFAULT 'admin@lingxi.art' NOT NULL,
 "terms_effective_date" text DEFAULT '2026年8月19日' NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
