import { z } from "zod"

import { STATUS_TYPE } from "./status"

export const MOVIE_AIRING_STATUS = [
  "released",
  "upcoming",
  "canceled",
  "in_production",
] as const

export const movieAiringStatus = z.enum(MOVIE_AIRING_STATUS)

const movieInput = {
  imdbId: z
    .string({
      invalid_type_error: "IMDB ID must be a string",
    })
    .optional(),
  tmdbId: z.string({
    required_error: "TMDB ID is required",
    invalid_type_error: "TMDB ID must be a string",
  }),
  title: z.string({
    required_error: "Title is required",
    invalid_type_error: "Title must be a string",
  }),
  originalTitle: z
    .string({
      invalid_type_error: "Original Title must be a string",
    })
    .optional(),
  tagline: z
    .string({
      invalid_type_error: "Tagline must be a string",
    })
    .optional(),
  overview: z
    .string({
      invalid_type_error: "Tagline must be a string",
    })
    .optional(),
  airingStatus: z
    .enum(MOVIE_AIRING_STATUS, {
      invalid_type_error: "only released and upcoming are accepted",
    })
    .optional(),
  originCountry: z
    .string({
      invalid_type_error: "Origin Country must be a string",
    })
    .optional(),
  originalLanguage: z.string({
    required_error: "Original Language is required",
    invalid_type_error: "Original Language must be a string",
  }),
  spokenLanguages: z
    .string({
      invalid_type_error: "Spoken Languages must be a string",
    })
    .optional(),
  releaseDate: z
    .string({
      invalid_type_error: "Release Date must be a string",
    })
    .optional(),
  budget: z
    .number({
      invalid_type_error: "Budget must be a number",
    })
    .optional(),
  revenue: z
    .number({
      invalid_type_error: "Revenue must be a number",
    })
    .optional(),
  runtime: z
    .number({
      invalid_type_error: "Runtime must be a number",
    })
    .optional(),
  homepage: z
    .string({
      invalid_type_error: "Homepage must be a string",
    })
    .optional(),
  backdrop: z
    .string({
      invalid_type_error: "Backdrop must be a string",
    })
    .optional(),
  poster: z
    .string({
      invalid_type_error: "Poster must be a string",
    })
    .optional(),
  metaTitle: z
    .string({
      invalid_type_error: "Meta Title must be a string",
    })
    .optional(),
  metaDescription: z
    .string({
      invalid_type_error: "Meta Description must be a string",
    })
    .optional(),
  genres: z
    .string({
      invalid_type_error: "Genre Id must be a string",
    })
    .array()
    .optional(),
  productionCompanies: z
    .string({
      invalid_type_error: "Production Company Id must be a string",
    })
    .array()
    .optional(),
  status: z
    .enum(STATUS_TYPE, {
      invalid_type_error:
        "only published, draft, rejected and in_review are accepted",
    })
    .optional(),
}

const updateMovieInput = {
  ...movieInput,
  id: z.string(),
  slug: z
    .string({
      required_error: "Slug is required",
      invalid_type_error: "Slug must be a string",
    })
    .regex(new RegExp(/^[a-zA-Z0-9_-]*$/), {
      message: "Slug should be character a-z, A-Z, number, - and _",
    }),
}

export const createMovieSchema = z.object({
  ...movieInput,
})

export const updateMovieSchema = z.object({
  ...updateMovieInput,
})

export type MovieAiringStatus = z.infer<typeof movieAiringStatus>
export type CreateMovieSchema = z.infer<typeof createMovieSchema>
export type UpdateMovieSchema = z.infer<typeof updateMovieSchema>
