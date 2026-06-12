import { os } from "@orpc/server"
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import {
  genres,
  insertGenreSchema,
  selectGenreSchema,
  updateGenreSchema,
} from "@/db/schema/genre"
import { movieGenres } from "@/db/schema/movie"
import { cuid, generateUniqueGenreSlug } from "@/lib/utils"

import {
  firstOrNull,
  firstValue,
  idInputSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "./helpers"

const createGenreSchema = insertGenreSchema.omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
})

const editGenreSchema = updateGenreSchema.extend({ id: z.string() })

const genreByMovieCountOutput = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  count: z.number(),
})

const genreSitemapOutput = z.object({
  slug: z.string().nullable(),
  updatedAt: z.date().nullable(),
})

const _createGenre = os
  .route({ method: "POST", path: "/genre/create" })
  .input(createGenreSchema)
  .output(z.array(selectGenreSchema))
  .handler(async ({ input }) => {
    const slug = await generateUniqueGenreSlug(input.title)
    const generatedMetaTitle = input.metaTitle ?? input.title
    const generatedMetaDescription = input.metaDescription ?? input.description

    return db
      .insert(genres)
      .values({
        ...input,
        id: cuid(),
        slug,
        metaTitle: generatedMetaTitle,
        metaDescription: generatedMetaDescription,
      })
      .returning()
  })

export const genreRouter = {
  genreDashboard: os
    .route({ method: "POST", path: "/genre/dashboard" })
    .input(pageSchema)
    .output(z.array(selectGenreSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(genres)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(genres.updatedAt)),
    ),
  genreById: os
    .route({ method: "GET", path: "/genre/by-id/{id}" })
    .input(idInputSchema)
    .output(selectGenreSchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db.select().from(genres).where(eq(genres.id, input.id)).limit(1),
      ),
    ),
  genreByTmdbId: os
    .route({ method: "GET", path: "/genre/by-tmdb-id/{tmdbId}" })
    .input(z.object({ tmdbId: z.string() }))
    .output(selectGenreSchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db
          .select()
          .from(genres)
          .where(eq(genres.tmdbId, input.tmdbId))
          .limit(1),
      ),
    ),
  genreByMovieCount: os
    .route({ method: "POST", path: "/genre/by-movie-count" })
    .input(pageSchema)
    .output(z.array(genreByMovieCountOutput))
    .handler(({ input }) =>
      db
        .select({
          id: genres.id,
          title: genres.title,
          slug: genres.slug,
          count: count(movieGenres.movieId),
        })
        .from(genres)
        .leftJoin(movieGenres, eq(movieGenres.genreId, genres.id))
        .groupBy(genres.id)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(genres.updatedAt)),
    ),
  genreSitemap: os
    .route({ method: "POST", path: "/genre/sitemap" })
    .input(pageSchema)
    .output(z.array(genreSitemapOutput))
    .handler(({ input }) =>
      db
        .select({ slug: genres.slug, updatedAt: genres.updatedAt })
        .from(genres)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(genres.id)),
    ),
  genreBySlug: os
    .route({ method: "GET", path: "/genre/by-slug/{slug}" })
    .input(z.object({ slug: z.string() }))
    .output(selectGenreSchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db
          .select()
          .from(genres)
          .where(eq(genres.slug, input.slug))
          .limit(1),
      ),
    ),
  genreSearch: os
    .route({ method: "POST", path: "/genre/search" })
    .input(searchSchema)
    .output(z.array(selectGenreSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(genres)
        .where(
          and(
            eq(genres.status, "published"),
            or(
              ilike(genres.title, `%${input.searchQuery}%`),
              ilike(genres.slug, `%${input.searchQuery}%`),
            ),
          ),
        )
        .limit(input.limit),
    ),
  genreSearchDashboard: os
    .route({ method: "POST", path: "/genre/search-dashboard" })
    .input(searchSchema)
    .output(z.array(selectGenreSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(genres)
        .where(
          or(
            ilike(genres.title, `%${input.searchQuery}%`),
            ilike(genres.slug, `%${input.searchQuery}%`),
          ),
        )
        .limit(input.limit),
    ),
  genreCount: os
    .route({ method: "GET", path: "/genre/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(
        await db
          .select({ value: count() })
          .from(genres)
          .where(eq(genres.status, "published")),
      ),
    ),
  genreCountDashboard: os
    .route({ method: "GET", path: "/genre/count-dashboard" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(genres)),
    ),
  genreCreate: _createGenre,
  genreUpdate: os
    .route({ method: "POST", path: "/genre/update" })
    .input(editGenreSchema)
    .output(z.array(selectGenreSchema))
    .handler(({ input }) => {
      const { id, ...values } = input

      return db
        .update(genres)
        .set({ ...values, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(genres.id, id))
        .returning()
    }),
  genreDelete: os
    .route({ method: "POST", path: "/genre/delete" })
    .input(idInputSchema)
    .output(z.array(selectGenreSchema))
    .handler(async ({ input }) => {
      return await db.transaction(async (tx) => {
        await tx.delete(movieGenres).where(eq(movieGenres.genreId, input.id))

        return tx.delete(genres).where(eq(genres.id, input.id)).returning()
      })
    }),
}
