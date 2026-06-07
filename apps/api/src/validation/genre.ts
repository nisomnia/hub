import { z } from "zod"

import { STATUS_TYPE } from "./status"

const genreInput = {
  tmdbId: z
    .string({
      invalid_type_error: "TMDB ID must be a string",
    })
    .optional(),
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .min(2)
    .max(32),
  description: z
    .string({
      invalid_type_error: "Description must be a string",
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
  featuredImage: z
    .string({
      invalid_type_error: "Featured Image ID must be a string",
    })
    .optional()
    .nullish(),
  status: z
    .enum(STATUS_TYPE, {
      invalid_type_error:
        "only published, draft, rejected and in_review are accepted",
    })
    .optional(),
}

const updateGenreInput = {
  ...genreInput,
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

export const createGenreSchema = z.object({
  ...genreInput,
})

export const updateGenreSchema = z.object({
  ...updateGenreInput,
})

export type CreateGenreSchema = z.infer<typeof createGenreSchema>
export type UpdateGenreSchema = z.infer<typeof updateGenreSchema>
