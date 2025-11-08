CREATE TABLE "farmer_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" text NOT NULL,
	"document_type" text NOT NULL,
	"document_url" text NOT NULL,
	"verified_at" timestamp,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "farmer_scheme_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" text NOT NULL,
	"scheme_id" uuid,
	"reason" text NOT NULL,
	"is_eligible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheme_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farmer_id" text NOT NULL,
	"scheme_id" uuid NOT NULL,
	"application_status" text DEFAULT 'not_applied' NOT NULL,
	"applied_on" timestamp NOT NULL,
	"updated_on" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scheme_required_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"is_mandatory" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_name" text NOT NULL,
	"state" text,
	"ministry" text NOT NULL,
	"benefit" text NOT NULL,
	"objective" text[] NOT NULL,
	"eligibility_criteria" text[] NOT NULL,
	"exclusions" text[],
	"documents_required" text[] NOT NULL,
	"application_process" text NOT NULL,
	"official_website" text NOT NULL,
	"last_updated_at" date NOT NULL,
	"features" text[],
	"components" text[],
	"targets" text[],
	"deadline" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "farmer_documents" ADD CONSTRAINT "farmer_documents_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_scheme_matches" ADD CONSTRAINT "farmer_scheme_matches_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_scheme_matches" ADD CONSTRAINT "farmer_scheme_matches_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_applications" ADD CONSTRAINT "scheme_applications_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_applications" ADD CONSTRAINT "scheme_applications_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_required_documents" ADD CONSTRAINT "scheme_required_documents_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;