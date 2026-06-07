import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

import { AD_POSITION, AD_TYPE, ads } from "../db/schema/ad"

export const adPosition = z.enum(AD_POSITION)
export const adType = z.enum(AD_TYPE)

export const createAdSchema = createInsertSchema(ads)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    title: z.string().min(2),
    content: z.string().min(2),
  })

export const updateAdSchema = createInsertSchema(ads)
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z
      .string({
        message: "ID is required",
      })
      .min(2),
    title: z.string().min(2),
    content: z.string().min(2),
  })

export type AdPosition = z.infer<typeof adPosition>
export type AdType = z.infer<typeof adType>
