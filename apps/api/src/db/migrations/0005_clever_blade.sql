ALTER TYPE "public"."movie_airing_status" ADD VALUE 'canceled';--> statement-breakpoint
ALTER TYPE "public"."movie_airing_status" ADD VALUE 'in_production';--> statement-breakpoint
ALTER TABLE "feeds" ADD COLUMN "status" "status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "production_companies" ADD COLUMN "status" "status" DEFAULT 'draft' NOT NULL;