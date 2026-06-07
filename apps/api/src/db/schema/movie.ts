import { relations } from "drizzle-orm"
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"

import { genres } from "./genre"
import { overviews } from "./overview"
import { productionCompanies } from "./production-company"
import { statusEnum } from "./status"

export const MOVIE_AIRING_STATUS = [
  "released",
  "upcoming",
  "canceled",
  "in_production",
] as const

export const movieAiringStatus = z.enum(MOVIE_AIRING_STATUS)

export const movieAiringStatusEnum = pgEnum(
  "movie_airing_status",
  MOVIE_AIRING_STATUS,
)

export const movies = pgTable("movies", {
  id: text("id").primaryKey(),
  imdbId: text("imdb_id"),
  tmdbId: text("tmdb_id").notNull().unique(),
  title: text("title").notNull(),
  originalTitle: text("original_title"),
  tagline: text("tagline"),
  slug: text("slug").notNull().unique(),
  airingStatus: movieAiringStatusEnum("airing_status")
    .notNull()
    .default("released"),
  originCountry: text("origin_country"),
  originalLanguage: text("original_language").notNull(),
  spokenLanguages: text("spoken_languages"),
  releaseDate: text("release_date"),
  revenue: integer("revenue"),
  runtime: integer("runtime"),
  budget: integer("budget"),
  homepage: text("homepage"),
  backdrop: text("backdrop"),
  poster: text("poster"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  status: statusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertMovieSchema = createInsertSchema(movies)
export const updateMovieSchema = createUpdateSchema(movies)

export const moviesRelations = relations(movies, ({ many }) => ({
  overviews: many(movieOverviews),
  genres: many(movieGenres),
  productionCompanies: many(movieProductionCompanies),
}))

export const movieGenres = pgTable(
  "_movie_genres",
  {
    movieId: text("movie_id")
      .notNull()
      .references(() => movies.id),
    genreId: text("genre_id")
      .notNull()
      .references(() => genres.id),
  },
  (t) => ({
    compoundKey: primaryKey({
      columns: [t.movieId, t.genreId],
    }),
  }),
)

export const insertMovieGenreSchema = createInsertSchema(movieGenres)
export const updateMovieGenreSchema = createUpdateSchema(movieGenres)

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}))

export const movieOverviews = pgTable(
  "_movie_overviews",
  {
    movieId: text("movie_id")
      .notNull()
      .references(() => movies.id),
    overviewId: text("overview_id")
      .notNull()
      .references(() => overviews.id),
  },
  (t) => ({
    compoundKey: primaryKey({
      columns: [t.movieId, t.overviewId],
    }),
  }),
)

export const insertMovieOverviewSchema = createInsertSchema(movieOverviews)
export const updateMovieOverviewSchema = createUpdateSchema(movieOverviews)

export const movieOverviewsRelations = relations(movieOverviews, ({ one }) => ({
  movie: one(movies, {
    fields: [movieOverviews.movieId],
    references: [movies.id],
  }),
  overview: one(overviews, {
    fields: [movieOverviews.overviewId],
    references: [overviews.id],
  }),
}))

export const movieProductionCompanies = pgTable(
  "_movie_production_companies",
  {
    movieId: text("movie_id")
      .notNull()
      .references(() => movies.id),
    productionCompanyId: text("production_company_id")
      .notNull()
      .references(() => productionCompanies.id),
  },
  (t) => ({
    compoundKey: primaryKey({
      columns: [t.movieId, t.productionCompanyId],
    }),
  }),
)

export const insertMovieProductionCompanySchema = createInsertSchema(
  movieProductionCompanies,
)
export const updateMovieProductionCompanySchema = createUpdateSchema(
  movieProductionCompanies,
)

export const movieProductionCompaniesRelations = relations(
  movieProductionCompanies,
  ({ one }) => ({
    movie: one(movies, {
      fields: [movieProductionCompanies.movieId],
      references: [movies.id],
    }),
    productionCompany: one(productionCompanies, {
      fields: [movieProductionCompanies.productionCompanyId],
      references: [productionCompanies.id],
    }),
  }),
)

export type InsertMovie = typeof movies.$inferInsert
export type SelectMovie = typeof movies.$inferSelect

export type InsertMovieGenre = typeof movieGenres.$inferInsert
export type SelectMovieGenre = typeof movieGenres.$inferSelect

export type InsertMovieOverview = typeof movieOverviews.$inferInsert
export type SelectMovieOverview = typeof movieOverviews.$inferSelect

export type InsertMovieProductionCompany =
  typeof movieProductionCompanies.$inferInsert
export type SelectMovieProductionCompany =
  typeof movieProductionCompanies.$inferSelect

export type MovieAiringStatus = z.infer<typeof movieAiringStatus>
