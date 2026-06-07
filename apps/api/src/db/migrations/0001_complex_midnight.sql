ALTER TABLE "movies" ALTER COLUMN "airing_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "_movie_overviews" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "status" "status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "movies" DROP COLUMN IF EXISTS "overview";