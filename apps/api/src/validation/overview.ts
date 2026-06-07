import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { LANGUAGE_TYPE } from "../db/schema/language"
import { overviews } from "../db/schema/overview"

export const createOverviewSchema = createInsertSchema(overviews)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    type: true,
  })
  .extend({
    title: z
      .string({
        message: "Title is required",
      })
      .min(2),
    content: z.string({
      message: "Description must be a string",
    }),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
  })

export const updateOverviewSchema = createInsertSchema(overviews)
  .omit({
    createdAt: true,
    updatedAt: true,
    type: true,
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
    title: z
      .string({
        message: "Title is required",
      })
      .min(2),
    content: z.string({
      message: "Description must be a string",
    }),
    language: z.enum(LANGUAGE_TYPE, {
      message: "only id and en are accepted",
    }),
  })

export type CreateOverviewSchema = z.infer<typeof createOverviewSchema>
export type UpdateOverviewSchema = z.infer<typeof updateOverviewSchema>
