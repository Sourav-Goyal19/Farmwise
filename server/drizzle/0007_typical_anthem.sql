ALTER TABLE "scheme_required_documents" DROP CONSTRAINT IF EXISTS "scheme_required_documents_scheme_id_schemes_id_fk";--> statement-breakpoint

ALTER TABLE "farmer_scheme_matches" DROP CONSTRAINT IF EXISTS "farmer_scheme_matches_scheme_id_schemes_id_fk";--> statement-breakpoint

ALTER TABLE "scheme_applications" DROP CONSTRAINT IF EXISTS "scheme_applications_scheme_id_schemes_id_fk";--> statement-breakpoint

DROP TABLE IF EXISTS "schemes";--> statement-breakpoint

CREATE TABLE "schemes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "scheme_name" text NOT NULL,
    "state" text,
    "ministry" text NOT NULL,
    "benefit" text NOT NULL,
    "objective" text NOT NULL,
    "eligibility_criteria" jsonb NOT NULL,
    "exclusions" jsonb,
    "documents_required" jsonb NOT NULL,
    "application_process" text NOT NULL,
    "official_website" text NOT NULL,
    "last_updated_at" timestamp NOT NULL,
    "features" jsonb,
    "components" jsonb,
    "targets" jsonb,
    "deadline" timestamp,
    "created_at" timestamp DEFAULT NOW() NOT NULL
);--> statement-breakpoint

ALTER TABLE "scheme_required_documents" 
ADD CONSTRAINT "scheme_required_documents_scheme_id_fk" 
FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE;--> statement-breakpoint

ALTER TABLE "farmer_scheme_matches" 
ADD CONSTRAINT "farmer_scheme_matches_scheme_id_fk" 
FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE;--> statement-breakpoint

ALTER TABLE "scheme_applications" 
ADD CONSTRAINT "scheme_applications_scheme_id_fk" 
FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE;--> statement-breakpoint