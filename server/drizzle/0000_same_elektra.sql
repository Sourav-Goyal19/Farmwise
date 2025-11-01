CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_id" uuid NOT NULL,
	"created_by" text NOT NULL,
	"activity_type" text NOT NULL,
	"details" text[] NOT NULL,
	"summary" text NOT NULL,
	"farmer_said" text NOT NULL,
	"photo_url" text,
	"notes" text,
	"suggestions" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "farmer_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" text NOT NULL,
	"asset_type" text NOT NULL,
	"brand" text,
	"quantity" integer DEFAULT 1,
	"condition" text,
	"acquired_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "farmer_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" text NOT NULL,
	"phone_number" varchar(10) NOT NULL,
	"aadhaar_number" varchar(12),
	"email" text,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "farmer_plots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" text NOT NULL,
	"plot_name" text,
	"area" numeric(8, 2) NOT NULL,
	"soil_type" text,
	"irrigation_type" text,
	"water_source" text,
	"latitude" double precision,
	"longitude" double precision,
	"is_owned" boolean DEFAULT true,
	"ownership_proof_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "farmers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"gender" text,
	"primary_language" text,
	"village" text,
	"district" text,
	"age" integer,
	"education_level" text,
	"total_land_area" numeric(8, 2),
	"farming_experience" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "plot_crops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plot_id" uuid NOT NULL,
	"crop_name" text NOT NULL,
	"variety" text,
	"season" text,
	"sowing_date" date,
	"expected_harvest_date" date,
	"current_stage" text,
	"estimated_yield_kg" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- ===========================
-- FOREIGN KEY CONSTRAINTS (Safe for re-run, Neon-compatible)
-- ===========================

ALTER TABLE "activity_logs" 
DROP CONSTRAINT IF EXISTS "activity_logs_crop_id_plot_crops_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_logs" 
ADD CONSTRAINT "activity_logs_crop_id_plot_crops_id_fk" 
FOREIGN KEY ("crop_id") REFERENCES "public"."plot_crops"("id") 
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "activity_logs" 
DROP CONSTRAINT IF EXISTS "activity_logs_created_by_farmers_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_logs" 
ADD CONSTRAINT "activity_logs_created_by_farmers_id_fk" 
FOREIGN KEY ("created_by") REFERENCES "public"."farmers"("id") 
ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "farmer_assets" 
DROP CONSTRAINT IF EXISTS "farmer_assets_farmer_id_farmers_id_fk";
--> statement-breakpoint
ALTER TABLE "farmer_assets" 
ADD CONSTRAINT "farmer_assets_farmer_id_farmers_id_fk" 
FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") 
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "farmer_contacts" 
DROP CONSTRAINT IF EXISTS "farmer_contacts_farmer_id_farmers_id_fk";
--> statement-breakpoint
ALTER TABLE "farmer_contacts" 
ADD CONSTRAINT "farmer_contacts_farmer_id_farmers_id_fk" 
FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") 
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "farmer_plots" 
DROP CONSTRAINT IF EXISTS "farmer_plots_farmer_id_farmers_id_fk";
--> statement-breakpoint
ALTER TABLE "farmer_plots" 
ADD CONSTRAINT "farmer_plots_farmer_id_farmers_id_fk" 
FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") 
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "plot_crops" 
DROP CONSTRAINT IF EXISTS "plot_crops_plot_id_farmer_plots_id_fk";
--> statement-breakpoint
ALTER TABLE "plot_crops" 
ADD CONSTRAINT "plot_crops_plot_id_farmer_plots_id_fk" 
FOREIGN KEY ("plot_id") REFERENCES "public"."farmer_plots"("id") 
ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
