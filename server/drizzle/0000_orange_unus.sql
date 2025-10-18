CREATE TYPE "public"."gender" AS ENUM('M', 'F', 'O');--> statement-breakpoint
CREATE TABLE "farmers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"gender" "gender" NOT NULL,
	"primary_language" text NOT NULL,
	"village" text NOT NULL,
	"district" text,
	"age" integer NOT NULL,
	"education_level" text,
	"total_land_area" numeric NOT NULL,
	"farming_experience" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
