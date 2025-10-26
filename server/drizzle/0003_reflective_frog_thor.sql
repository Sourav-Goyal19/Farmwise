CREATE TABLE "farmer_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" text NOT NULL,
	"plot_id" uuid,
	"activity_type" text NOT NULL,
	"crop_name" text,
	"date" date DEFAULT now(),
	"description" text,
	"validated" boolean DEFAULT false,
	"source" text DEFAULT 'voice',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "farmer_assets" (
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
CREATE TABLE "farmer_contacts" (
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
CREATE TABLE "farmer_plots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" text NOT NULL,
	"plot_name" text,
	"area" numeric NOT NULL,
	"soil_type" text,
	"irrigation_type" text,
	"water_source" text,
	"latitude" numeric,
	"longitude" numeric,
	"is_owned" boolean DEFAULT true,
	"ownership_proof_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plot_crops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plot_id" uuid NOT NULL,
	"crop_name" text NOT NULL,
	"variety" text,
	"season" text,
	"sowing_date" date,
	"expected_harvest_date" date,
	"current_stage" text,
	"estimated_yield_kg" numeric,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "farmers" ALTER COLUMN "gender" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "farmer_activities" ADD CONSTRAINT "farmer_activities_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_activities" ADD CONSTRAINT "farmer_activities_plot_id_farmer_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."farmer_plots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_assets" ADD CONSTRAINT "farmer_assets_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_contacts" ADD CONSTRAINT "farmer_contacts_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_plots" ADD CONSTRAINT "farmer_plots_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_crops" ADD CONSTRAINT "plot_crops_plot_id_farmer_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."farmer_plots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."gender";