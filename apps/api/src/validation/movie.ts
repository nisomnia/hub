import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { MOVIE_AIRING_STATUS, movies } from "../db/schema/movie"
import { STATUS_TYPE } from "../db/schema/status"

export const movieAiringStatus = z.enum(MOVIE_AIRING_STATUS)

export const createMovieSchema = createInsertSchema(movies)
  .omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    imdbId: z
      .string({
        message: "IMDB ID must be a string",
      })
      .optional(),
    title: z.string({
      message: "Title is required",
    }),
    originalTitle: z
      .string({
        message: "Original Title must be a string",
      })
      .optional(),
    tagline: z
      .string({
        message: "Tagline must be a string",
      })
      .optional(),
    airingStatus: z
      .enum(MOVIE_AIRING_STATUS, {
        message: "only released and upcoming are accepted",
      })
      .optional(),
    originCountry: z
      .string({
        message: "Origin Country must be a string",
      })
      .optional(),
    spokenLanguages: z
      .string({
        message: "Spoken Languages must be a string",
      })
      .optional(),
    releaseDate: z
      .string({
        message: "Release Date must be a string",
      })
      .optional(),
    budget: z
      .number({
        message: "Budget must be a number",
      })
      .optional(),
    revenue: z
      .number({
        message: "Revenue must be a number",
      })
      .optional(),
    runtime: z
      .number({
        message: "Runtime must be a number",
      })
      .optional(),
    homepage: z
      .string({
        message: "Homepage must be a string",
      })
      .optional(),
    backdrop: z
      .string({
        message: "Backdrop must be a string",
      })
      .optional(),
    poster: z
      .string({
        message: "Poster must be a string",
      })
      .optional(),
    metaTitle: z
      .string({
        message: "Meta Title must be a string",
      })
      .optional(),
    metaDescription: z
      .string({
        message: "Meta Description must be a string",
      })
      .optional(),
    genres: z
      .string({
        message: "Genre Id must be a string",
      })
      .array()
      .optional(),
    productionCompanies: z
      .string({
        message: "Production Company Id must be a string",
      })
      .array()
      .optional(),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
  })

export const updateMovieSchema = createInsertSchema(movies)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string(),
    slug: z
      .string({
        message: "Slug is required",
      })
      .regex(new RegExp(/^[a-zA-Z0-9_-]*$/), {
        message: "Slug should be character a-z, A-Z, number, - and _",
      }),
    imdbId: z
      .string({
        message: "IMDB ID must be a string",
      })
      .optional(),
    title: z.string({
      message: "Title is required",
    }),
    originalTitle: z
      .string({
        message: "Original Title must be a string",
      })
      .optional(),
    tagline: z
      .string({
        message: "Tagline must be a string",
      })
      .optional(),
    airingStatus: z
      .enum(MOVIE_AIRING_STATUS, {
        message: "only released and upcoming are accepted",
      })
      .optional(),
    originCountry: z
      .string({
        message: "Origin Country must be a string",
      })
      .optional(),
    spokenLanguages: z
      .string({
        message: "Spoken Languages must be a string",
      })
      .optional(),
    releaseDate: z
      .string({
        message: "Release Date must be a string",
      })
      .optional(),
    budget: z
      .number({
        message: "Budget must be a number",
      })
      .optional(),
    revenue: z
      .number({
        message: "Revenue must be a number",
      })
      .optional(),
    runtime: z
      .number({
        message: "Runtime must be a number",
      })
      .optional(),
    homepage: z
      .string({
        message: "Homepage must be a string",
      })
      .optional(),
    backdrop: z
      .string({
        message: "Backdrop must be a string",
      })
      .optional(),
    poster: z
      .string({
        message: "Poster must be a string",
      })
      .optional(),
    metaTitle: z
      .string({
        message: "Meta Title must be a string",
      })
      .optional(),
    metaDescription: z
      .string({
        message: "Meta Description must be a string",
      })
      .optional(),
    genres: z
      .string({
        message: "Genre Id must be a string",
      })
      .array()
      .optional(),
    productionCompanies: z
      .string({
        message: "Production Company Id must be a string",
      })
      .array()
      .optional(),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
  })

export type MovieAiringStatus = z.infer<typeof movieAiringStatus>
export type CreateMovieSchema = z.infer<typeof createMovieSchema>
export type UpdateMovieSchema = z.infer<typeof updateMovieSchema>
