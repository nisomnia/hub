import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { genres } from "../db/schema/genre"
import { STATUS_TYPE } from "../db/schema/status"

export const createGenreSchema = createInsertSchema(genres)
  .omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    tmdbId: z
      .string({
        message: "TMDB ID must be a string",
      })
      .optional(),
    title: z
      .string({
        message: "Title is required",
      })
      .min(2)
      .max(32),
    description: z
      .string({
        message: "Description must be a string",
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
    featuredImage: z
      .string({
        message: "Featured Image ID must be a string",
      })
      .nullish(),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
  })

export const updateGenreSchema = createInsertSchema(genres)
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
    tmdbId: z
      .string({
        message: "TMDB ID must be a string",
      })
      .optional(),
    title: z
      .string({
        message: "Title is required",
      })
      .min(2)
      .max(32),
    description: z
      .string({
        message: "Description must be a string",
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
    featuredImage: z
      .string({
        message: "Featured Image ID must be a string",
      })
      .nullish(),
    status: z
      .enum(STATUS_TYPE, {
        message: "only published, draft, rejected and in_review are accepted",
      })
      .optional(),
  })

export type CreateGenreSchema = z.infer<typeof createGenreSchema>
export type UpdateGenreSchema = z.infer<typeof updateGenreSchema>
