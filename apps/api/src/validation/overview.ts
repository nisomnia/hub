import { z } from "zod"

import { LANGUAGE_TYPE } from "./language"

export const OVERVIEW_TYPE = ["game", "movie", "tv"] as const

const overviewInput = {
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .min(2),
  content: z.string({
    invalid_type_error: "Description must be a string",
  }),
  language: z.enum(LANGUAGE_TYPE, {
    invalid_type_error: "only id and en are accepted",
  }),
}

const updateOverviewInput = {
  ...overviewInput,
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

export const createOverviewSchema = z.object({
  ...overviewInput,
})

export const updateOverviewSchema = z.object({
  ...updateOverviewInput,
})

export type CreateOverviewSchema = z.infer<typeof createOverviewSchema>
export type UpdateOverviewSchema = z.infer<typeof updateOverviewSchema>
