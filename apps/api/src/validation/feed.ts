import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { FEED_TYPE, feeds } from "../db/schema/feed"
import { LANGUAGE_TYPE } from "../db/schema/language"

export const feedType = z.enum(FEED_TYPE)

export const createFeedSchema = createInsertSchema(feeds)
  .omit({
    id: true,
    slug: true,
    createdAt: true,
    updatedAt: true,
    status: true,
  })
  .extend({
    title: z
      .string({
        message: "Title is required",
      })
      .min(2),
    featuredImage: z
      .string({
        message: "Featured Image ID must be a string",
      })
      .nullish(),
    link: z
      .string({
        message: "Link must be a string",
      })
      .optional(),
    owner: z
      .string({
        message: "Owner must be a string",
      })
      .optional(),
    topics: z
      .string({
        message: "Topic Id is required",
      })
      .array(),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
  })

export const updateFeedSchema = createInsertSchema(feeds)
  .omit({
    createdAt: true,
    updatedAt: true,
    status: true,
  })
  .extend({
    id: z.string({
      message: "Id is required",
    }),
    slug: z
      .string({
        message: "Slug is required",
      })
      .regex(new RegExp(/^[a-zA-Z0-9_-]*$/), {
        message: "Slug should be character a-z, A-Z, number, - and _",
      }),
    title: z
      .string({
        message: "Title is required",
      })
      .min(2),
    featuredImage: z
      .string({
        message: "Featured Image ID must be a string",
      })
      .nullish(),
    link: z
      .string({
        message: "Link must be a string",
      })
      .optional(),
    owner: z
      .string({
        message: "Owner must be a string",
      })
      .optional(),
    topics: z
      .string({
        message: "Topic Id is required",
      })
      .array(),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
  })

export type CreateFeedSchema = z.infer<typeof createFeedSchema>
export type UpdateFeedSchema = z.infer<typeof updateFeedSchema>
export type FeedType = z.infer<typeof feedType>
