CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"scheduled_for" timestamp,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"job_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plot_crops" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plot_crops" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE cascade ON UPDATE no action;