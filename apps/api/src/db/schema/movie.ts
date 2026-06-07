import { relations } from "drizzle-orm"
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { MOVIE_AIRING_STATUS } from "@/lib/validation/movie"
import { genres } from "./genre"
import { overviews } from "./overview"
import { productionCompanies } from "./production-company"
import { statusEnum } from "./status"

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
