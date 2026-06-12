import { os } from "@orpc/server"
import { and, count, desc, eq, ilike, lt, ne, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/db"
import { genres } from "@/db/schema/genre"
import {
  insertMovieSchema,
  movieGenres,
  movieOverviews,
  movieProductionCompanies,
  movies,
  selectMovieSchema,
  updateMovieSchema,
} from "@/db/schema/movie"
import { overviews } from "@/db/schema/overview"
import { productionCompanies } from "@/db/schema/production-company"
import { cuid, generateUniqueMovieSlug } from "@/lib/utils"

import {
  firstOrNull,
  firstValue,
  idInputSchema,
  infiniteSchema,
  offsetFromPage,
  pageSchema,
  searchSchema,
} from "./helpers"

const movieGenreOutput = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
})

const movieOverviewRowOutput = z.object({
  id: z.string(),
  title: z.string(),
  language: z.string(),
  content: z.string(),
})

const movieCompanyOutput = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
})

const movieDetailOutput = selectMovieSchema.extend({
  overview: z.string().nullable(),
  overviews: z.array(movieOverviewRowOutput),
  genres: z.array(movieGenreOutput),
  productionCompanies: z.array(movieCompanyOutput),
})

const movieJoinOutput = z.object({ movie: selectMovieSchema })

const infiniteMoviesOutput = z.object({
  movies: z.array(selectMovieSchema),
  nextCursor: z.date().nullable(),
})

const movieSitemapOutput = z.object({
  slug: z.string(),
  updatedAt: z.date().nullable(),
})

const createMovieSchema = insertMovieSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    overview: z.string().optional(),
    genres: z.array(z.string()).optional(),
    productionCompanies: z.array(z.string()).optional(),
  })

const editMovieSchema = updateMovieSchema.extend({
  id: z.string(),
  overview: z.string().optional(),
  genres: z.array(z.string()).optional(),
  productionCompanies: z.array(z.string()).optional(),
})

async function movieDetails(movieId: string) {
  const overviewRows = await db
    .select({
      id: overviews.id,
      title: overviews.title,
      language: overviews.language,
      content: overviews.content,
    })
    .from(movieOverviews)
    .innerJoin(overviews, eq(movieOverviews.overviewId, overviews.id))
    .where(eq(movieOverviews.movieId, movieId))
  const genreRows = await db
    .select({ id: genres.id, title: genres.title, slug: genres.slug })
    .from(movieGenres)
    .innerJoin(genres, eq(movieGenres.genreId, genres.id))
    .where(eq(movieGenres.movieId, movieId))
  const companyRows = await db
    .select({
      id: productionCompanies.id,
      name: productionCompanies.name,
      logo: productionCompanies.logo,
    })
    .from(movieProductionCompanies)
    .innerJoin(
      productionCompanies,
      eq(movieProductionCompanies.productionCompanyId, productionCompanies.id),
    )
    .where(eq(movieProductionCompanies.movieId, movieId))

  return { overviewRows, genreRows, companyRows }
}

async function syncMovieRelations(input: z.infer<typeof editMovieSchema>) {
  const {
    genres: genreIds,
    id,
    overview,
    productionCompanies: companyIds,
  } = input

  await db.delete(movieOverviews).where(eq(movieOverviews.movieId, id))
  await db.delete(movieGenres).where(eq(movieGenres.movieId, id))
  await db
    .delete(movieProductionCompanies)
    .where(eq(movieProductionCompanies.movieId, id))

  if (overview) {
    const overviewData = await db
      .insert(overviews)
      .values({
        id: cuid(),
        title: input.title ?? id,
        type: "movie",
        content: overview,
        language: "en",
      })
      .returning()
    await db
      .insert(movieOverviews)
      .values({ movieId: id, overviewId: overviewData[0].id })
  }

  if (genreIds && genreIds.length > 0) {
    await db
      .insert(movieGenres)
      .values(genreIds.map((genreId) => ({ movieId: id, genreId })))
  }

  if (companyIds && companyIds.length > 0) {
    await db.insert(movieProductionCompanies).values(
      companyIds.map((productionCompanyId) => ({
        movieId: id,
        productionCompanyId,
      })),
    )
  }
}

const _createMovie = os
  .route({ method: "POST", path: "/movie/create" })
  .input(createMovieSchema)
  .output(z.array(selectMovieSchema))
  .handler(async ({ input }) => {
    const {
      genres: genreIds,
      overview,
      productionCompanies: companyIds,
      ...values
    } = input
    const slug = await generateUniqueMovieSlug(input.title)
    const generatedMetaTitle = input.metaTitle ?? input.title
    const generatedMetaDescription =
      input.metaDescription ?? overview ?? input.title
    const movieId = cuid()
    const data = await db
      .insert(movies)
      .values({
        ...values,
        id: movieId,
        slug,
        metaTitle: generatedMetaTitle,
        metaDescription: generatedMetaDescription,
      })
      .returning()

    if (overview) {
      const overviewData = await db
        .insert(overviews)
        .values({
          id: cuid(),
          title: input.title,
          type: "movie",
          content: overview,
          language: "en",
        })
        .returning()
      await db
        .insert(movieOverviews)
        .values({ movieId, overviewId: overviewData[0].id })
    }

    if (companyIds && companyIds.length > 0) {
      await db.insert(movieProductionCompanies).values(
        companyIds.map((productionCompanyId) => ({
          movieId,
          productionCompanyId,
        })),
      )
    }

    if (genreIds && genreIds.length > 0) {
      await db
        .insert(movieGenres)
        .values(genreIds.map((genreId) => ({ movieId, genreId })))
    }

    return data
  })

export const movieRouter = {
  movieById: os
    .route({ method: "GET", path: "/movie/by-id/{id}" })
    .input(idInputSchema)
    .output(movieDetailOutput.nullable())
    .handler(async ({ input }) => {
      const movie = firstOrNull(
        await db.select().from(movies).where(eq(movies.id, input.id)).limit(1),
      )

      if (!movie) return null

      const { companyRows, genreRows, overviewRows } = await movieDetails(
        movie.id,
      )

      return {
        ...movie,
        overview: overviewRows[0]?.content ?? null,
        overviews: overviewRows,
        genres: genreRows,
        productionCompanies: companyRows,
      }
    }),
  movieBySlug: os
    .route({ method: "GET", path: "/movie/by-slug/{slug}" })
    .input(z.object({ slug: z.string() }))
    .output(movieDetailOutput.nullable())
    .handler(async ({ input }) => {
      const movie = firstOrNull(
        await db
          .select()
          .from(movies)
          .where(eq(movies.slug, input.slug))
          .limit(1),
      )

      if (!movie) return null

      const { companyRows, genreRows, overviewRows } = await movieDetails(
        movie.id,
      )

      return {
        ...movie,
        overview: overviewRows[0]?.content ?? null,
        overviews: overviewRows,
        genres: genreRows,
        productionCompanies: companyRows,
      }
    }),
  movieByTmdbId: os
    .route({ method: "GET", path: "/movie/by-tmdb-id/{tmdbId}" })
    .input(z.object({ tmdbId: z.string() }))
    .output(selectMovieSchema.nullable())
    .handler(async ({ input }) =>
      firstOrNull(
        await db
          .select()
          .from(movies)
          .where(eq(movies.tmdbId, input.tmdbId))
          .limit(1),
      ),
    ),
  movieLatest: os
    .route({ method: "POST", path: "/movie/latest" })
    .input(pageSchema)
    .output(z.array(selectMovieSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(movies)
        .where(eq(movies.status, "published"))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(movies.updatedAt)),
    ),
  movieLatestInfinite: os
    .route({ method: "POST", path: "/movie/latest-infinite" })
    .input(infiniteSchema)
    .output(infiniteMoviesOutput)
    .handler(async ({ input }) => {
      const data = await db
        .select()
        .from(movies)
        .where(
          input.cursor
            ? and(
                eq(movies.status, "published"),
                lt(movies.updatedAt, input.cursor),
              )
            : eq(movies.status, "published"),
        )
        .limit(input.limit + 1)
        .orderBy(desc(movies.updatedAt))
      const nextItem = data.length > input.limit ? data.pop() : undefined

      return { movies: data, nextCursor: nextItem?.updatedAt ?? null }
    }),
  movieByGenreId: os
    .route({ method: "POST", path: "/movie/by-genre-id" })
    .input(pageSchema.extend({ genreId: z.string() }))
    .output(z.array(movieJoinOutput))
    .handler(({ input }) =>
      db
        .select({ movie: movies })
        .from(movieGenres)
        .innerJoin(movies, eq(movieGenres.movieId, movies.id))
        .where(
          and(
            eq(movieGenres.genreId, input.genreId),
            eq(movies.status, "published"),
          ),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(movies.updatedAt)),
    ),
  movieByGenreIdInfinite: os
    .route({ method: "POST", path: "/movie/by-genre-id-infinite" })
    .input(infiniteSchema.extend({ genreId: z.string() }))
    .output(infiniteMoviesOutput)
    .handler(async ({ input }) => {
      const data = await db
        .select({ movie: movies })
        .from(movieGenres)
        .innerJoin(movies, eq(movieGenres.movieId, movies.id))
        .where(
          input.cursor
            ? and(
                eq(movieGenres.genreId, input.genreId),
                eq(movies.status, "published"),
                lt(movies.updatedAt, input.cursor),
              )
            : and(
                eq(movieGenres.genreId, input.genreId),
                eq(movies.status, "published"),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(movies.updatedAt))
      const moviesData = data.map((item) => item.movie)
      const nextItem =
        moviesData.length > input.limit ? moviesData.pop() : undefined

      return { movies: moviesData, nextCursor: nextItem?.updatedAt ?? null }
    }),
  movieByProductionCompanyId: os
    .route({ method: "POST", path: "/movie/by-production-company-id" })
    .input(pageSchema.extend({ productionCompanyId: z.string() }))
    .output(z.array(movieJoinOutput))
    .handler(({ input }) =>
      db
        .select({ movie: movies })
        .from(movieProductionCompanies)
        .innerJoin(movies, eq(movieProductionCompanies.movieId, movies.id))
        .where(
          and(
            eq(
              movieProductionCompanies.productionCompanyId,
              input.productionCompanyId,
            ),
            eq(movies.status, "published"),
          ),
        )
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(movies.updatedAt)),
    ),
  movieByProductionCompanyIdInfinite: os
    .route({ method: "POST", path: "/movie/by-production-company-id-infinite" })
    .input(infiniteSchema.extend({ productionCompanyId: z.string() }))
    .output(infiniteMoviesOutput)
    .handler(async ({ input }) => {
      const data = await db
        .select({ movie: movies })
        .from(movieProductionCompanies)
        .innerJoin(movies, eq(movieProductionCompanies.movieId, movies.id))
        .where(
          input.cursor
            ? and(
                eq(
                  movieProductionCompanies.productionCompanyId,
                  input.productionCompanyId,
                ),
                eq(movies.status, "published"),
                lt(movies.updatedAt, input.cursor),
              )
            : and(
                eq(
                  movieProductionCompanies.productionCompanyId,
                  input.productionCompanyId,
                ),
                eq(movies.status, "published"),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(movies.updatedAt))
      const moviesData = data.map((item) => item.movie)
      const nextItem =
        moviesData.length > input.limit ? moviesData.pop() : undefined

      return { movies: moviesData, nextCursor: nextItem?.updatedAt ?? null }
    }),
  movieRelatedInfinite: os
    .route({ method: "POST", path: "/movie/related-infinite" })
    .input(
      infiniteSchema.extend({
        currentMovieId: z.string(),
        genreId: z.string(),
      }),
    )
    .output(infiniteMoviesOutput)
    .handler(async ({ input }) => {
      const data = await db
        .select({ movie: movies })
        .from(movieGenres)
        .innerJoin(movies, eq(movieGenres.movieId, movies.id))
        .where(
          input.cursor
            ? and(
                eq(movieGenres.genreId, input.genreId),
                eq(movies.status, "published"),
                ne(movies.id, input.currentMovieId),
                lt(movies.updatedAt, input.cursor),
              )
            : and(
                eq(movieGenres.genreId, input.genreId),
                eq(movies.status, "published"),
                ne(movies.id, input.currentMovieId),
              ),
        )
        .limit(input.limit + 1)
        .orderBy(desc(movies.updatedAt))
      const moviesData = data.map((item) => item.movie)
      const nextItem =
        moviesData.length > input.limit ? moviesData.pop() : undefined

      return { movies: moviesData, nextCursor: nextItem?.updatedAt ?? null }
    }),
  movieDashboard: os
    .route({ method: "POST", path: "/movie/dashboard" })
    .input(pageSchema)
    .output(z.array(selectMovieSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(movies)
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(movies.updatedAt)),
    ),
  movieSitemap: os
    .route({ method: "POST", path: "/movie/sitemap" })
    .input(pageSchema)
    .output(z.array(movieSitemapOutput))
    .handler(({ input }) =>
      db
        .select({ slug: movies.slug, updatedAt: movies.updatedAt })
        .from(movies)
        .where(eq(movies.status, "published"))
        .limit(input.perPage)
        .offset(offsetFromPage(input))
        .orderBy(desc(movies.id)),
    ),
  movieCount: os
    .route({ method: "GET", path: "/movie/count" })
    .output(z.number())
    .handler(async () =>
      firstValue(
        await db
          .select({ value: count() })
          .from(movies)
          .where(eq(movies.status, "published")),
      ),
    ),
  movieCountDashboard: os
    .route({ method: "GET", path: "/movie/count-dashboard" })
    .output(z.number())
    .handler(async () =>
      firstValue(await db.select({ value: count() }).from(movies)),
    ),
  movieSearch: os
    .route({ method: "POST", path: "/movie/search" })
    .input(searchSchema)
    .output(z.array(selectMovieSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(movies)
        .where(
          and(
            eq(movies.status, "published"),
            or(
              ilike(movies.title, `%${input.searchQuery}%`),
              ilike(movies.slug, `%${input.searchQuery}%`),
            ),
          ),
        )
        .limit(input.limit),
    ),
  movieSearchDashboard: os
    .route({ method: "POST", path: "/movie/search-dashboard" })
    .input(searchSchema)
    .output(z.array(selectMovieSchema))
    .handler(({ input }) =>
      db
        .select()
        .from(movies)
        .where(
          or(
            ilike(movies.title, `%${input.searchQuery}%`),
            ilike(movies.slug, `%${input.searchQuery}%`),
          ),
        )
        .limit(input.limit),
    ),
  movieCreate: _createMovie,
  movieUpdate: os
    .route({ method: "POST", path: "/movie/update" })
    .input(editMovieSchema)
    .output(z.array(selectMovieSchema))
    .handler(async ({ input }) => {
      const {
        genres: genreIds,
        id,
        overview,
        productionCompanies: companyIds,
        ...values
      } = input
      const data = await db
        .update(movies)
        .set({ ...values, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(movies.id, id))
        .returning()

      await syncMovieRelations({
        ...input,
        genres: genreIds,
        overview,
        productionCompanies: companyIds,
      })

      return data
    }),
  movieUpdateWithoutChangeUpdatedDate: os
    .route({
      method: "POST",
      path: "/movie/update-without-change-updated-date",
    })
    .input(editMovieSchema)
    .output(z.array(selectMovieSchema))
    .handler(async ({ input }) => {
      const {
        genres: genreIds,
        id,
        overview,
        productionCompanies: companyIds,
        ...values
      } = input
      const data = await db
        .update(movies)
        .set(values)
        .where(eq(movies.id, id))
        .returning()

      await syncMovieRelations({
        ...input,
        genres: genreIds,
        overview,
        productionCompanies: companyIds,
      })

      return data
    }),
  movieDelete: os
    .route({ method: "POST", path: "/movie/delete" })
    .input(idInputSchema)
    .output(z.array(selectMovieSchema))
    .handler(async ({ input }) => {
      await db
        .delete(movieOverviews)
        .where(eq(movieOverviews.movieId, input.id))
      await db.delete(movieGenres).where(eq(movieGenres.movieId, input.id))
      await db
        .delete(movieProductionCompanies)
        .where(eq(movieProductionCompanies.movieId, input.id))

      return db.delete(movies).where(eq(movies.id, input.id)).returning()
    }),
}
