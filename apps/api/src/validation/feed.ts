import { z } from "zod"

import { LANGUAGE_TYPE } from "./language"

export const FEED_TYPE = ["website", "tiktok", "x", "facebook"] as const

export const feedType = z.enum(FEED_TYPE)

const feedInput = {
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .min(2),
  type: z
    .enum(FEED_TYPE, {
      invalid_type_error: "only website, tiktok, x, facebook are accepted",
    })
    .optional(),
  featuredImage: z
    .string({
      invalid_type_error: "Featured Image ID must be a string",
    })
    .optional()
    .nullish(),
  topics: z
    .string({
      required_error: "Topic Id is required",
      invalid_type_error: "Topic Id must be a string",
    })
    .array(),
  link: z
    .string({
      invalid_type_error: "Link must be a string",
    })
    .optional(),
  owner: z
    .string({
      invalid_type_error: "Owner must be a string",
    })
    .optional(),
  language: z.enum(LANGUAGE_TYPE, {
    invalid_type_error: "only id and en are accepted",
  }),
}

const updateFeedInput = {
  ...feedInput,
  id: z.string({
    required_error: "Id is required",
    invalid_type_error: "Id must be a number",
  }),
  slug: z
    .string({
      required_error: "Slug is required",
      invalid_type_error: "Slug must be a string",
    })
    .regex(new RegExp(/^[a-zA-Z0-9_-]*$/), {
      message: "Slug should be character a-z, A-Z, number, - and _",
    }),
}

export const createFeedSchema = z.object({
  ...feedInput,
})

export const updateFeedSchema = z.object({
  ...updateFeedInput,
})

export type CreateFeedSchema = z.infer<typeof createFeedSchema>
export type UpdateFeedSchema = z.infer<typeof updateFeedSchema>
export type FeedType = z.infer<typeof feedType>
